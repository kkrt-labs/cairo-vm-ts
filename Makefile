.PHONY: compile-cairo-zero compile-cairo compile build build-cairo-vm-cli \
build-cairo-vm-rs-cli build-cairo-vm-zig-cli build-cairo build-sierra-compiler build-cairo-compiler \
run-all diff-test bench clean-diff-test clean-bench clean-tmp

# Clone & build the other VMs - Assume that related lang are installed
CAIRO_VM_RS_CLI:=cairo-vm/target/release/cairo-vm-cli
CAIRO_VM_ZIG_CLI:=ziggy-starkdust/zig-out/bin/ziggy-starkdust

$(CAIRO_VM_RS_CLI):
	@git submodule update --init cairo-vm; \
	cd cairo-vm; cargo build --release --bin cairo-vm-cli

$(CAIRO_VM_ZIG_CLI):
	@git submodule update --init ziggy-starkdust \
	cd ziggy-starkdust; zig build -Doptimize=ReleaseFast

build:
	@bun install; bun link

build-cairo-vm-rs-cli: | $(CAIRO_VM_RS_CLI)

build-cairo-vm-zig-cli: | $(CAIRO_VM_ZIG_CLI)

build-cairo-vm-cli: build build-cairo-vm-rs-cli build-cairo-vm-zig-cli

CAIRO_COMPILER=cairo/target/release/cairo-compile
SIERRA_COMPILER=cairo/target/release/sierra-compile-json

$(CAIRO_COMPILER):
	@git submodule update --init cairo; \
	cd cairo; cargo build --release --bin cairo-compile

$(SIERRA_COMPILER):
	@git submodule update --init cairo; \
	cd cairo; cargo build --release --bin sierra-compile-json

build-cairo-compiler: | $(CAIRO_COMPILER)
build-sierra-compiler: | $(SIERRA_COMPILER)
build-cairo: build-cairo-compiler build-sierra-compiler

TMP_PREFIX="cairo-vm-ts"

CAIRO_0_PATH=cairo_programs/cairo_0
CAIRO_0_BENCHMARK_PATH=cairo_programs/cairo_0/benchmarks
CAIRO_0_FILES:=$(shell find $(CAIRO_0_PATH) -name '*.cairo')
CAIRO_0_BENCHMARK_FILES:=$(shell find $(CAIRO_0_BENCHMARK_PATH) -name '*.cairo')
VALID_CAIRO_0_FILES=$(shell find $(CAIRO_0_PATH) -maxdepth 1 -name '*.cairo' -not -name 'range_check96_builtin.cairo')
COMPILED_CAIRO_0_FILES:=$(CAIRO_0_FILES:%.cairo=%.json)
COMPILED_CAIRO_0_BENCHMARK_FILES:=$(CAIRO_0_BENCHMARK_FILES:%.cairo=%.json)
VALID_COMPILED_CAIRO_0_FILES:=$(VALID_CAIRO_0_FILES:%.cairo=%.json)

CAIRO_PATH=cairo_programs/cairo/
CAIRO_FILES:=$(shell find $(CAIRO_PATH) -name '*.cairo')
SIERRA_FILES:=$(CAIRO_FILES:%.cairo=%.sierra)
COMPILED_CAIRO_FILES:=$(SIERRA_FILES:%.sierra=%.json)

$(COMPILED_CAIRO_FILES): %.json: %.sierra
	$(SIERRA_COMPILER) $< $@

%.json: %.cairo
	poetry run cairo-compile $< --output $@

%.sierra: %.cairo
	$(CAIRO_COMPILER) -r -s $< $@


compile-cairo-zero: $(COMPILED_CAIRO_0_FILES)
compile-cairo: $(COMPILED_CAIRO_FILES)
compile: build-cairo compile-cairo-zero compile-cairo

run-all: $(VALID_COMPILED_CAIRO_0_FILES) $(COMPILED_CAIRO_FILES)
	@failed_tests_ctr=0; \
	failed_tests=""; \
	passed_tests_ctr=0; \
	for file in $^; do \
		echo "Running $$file..."; \
		cairo run -s -l all_cairo $$file; \
		exit_code=$$?; \
		if [ $$exit_code -ne 0 ]; then \
			failed_tests_ctr=$$((failed_tests_ctr + 1)); \
			failed_tests="$$failed_tests $$file"; \
		else \
			passed_tests_ctr=$$((passed_tests_ctr + 1)); \
		fi; \
	done; \
	if [ $$failed_tests_ctr -ne 0 ];  then \
		echo "$$failed_tests_ctr/$$((passed_tests_ctr + failed_tests_ctr)) tests failed: "; \
		for file in $$failed_tests; do \
			echo $$file; \
		done; \
		exit 1; \
	else \
		echo "All $$passed_tests_ctr tests passed."; \
	fi

diff-test: $(VALID_COMPILED_CAIRO_0_FILES)
	@TMP_DIR=$(shell mktemp -d -t $(TMP_PREFIX)-diff-test.XXXXXXXX); \
	failed_tests_ctr=0; \
	failed_tests=""; \
	passed_tests_ctr=0; \
	echo "TMP_DIR: $$TMP_DIR"; \
	for file in $^; do \
		echo "Diff testing $$file..."; \
		ts_memory=$$TMP_DIR/$$(basename $$file .json).ts.memory; \
		py_memory=$$TMP_DIR/$$(basename $$file .json).py.memory; \
		rs_memory=$$TMP_DIR/$$(basename $$file .json).rs.memory; \
		zig_memory=$$TMP_DIR/$$(basename $$file .json).zig.memory; \
		ts_trace=$$TMP_DIR/$$(basename $$file .json).ts.trace; \
		py_trace=$$TMP_DIR/$$(basename $$file .json).py.trace; \
		rs_trace=$$TMP_DIR/$$(basename $$file .json).rs.trace; \
		zig_trace=$$TMP_DIR/$$(basename $$file .json).zig.trace; \
		cairo run $$file --silent --offset 1 --export-memory $$ts_memory --export-trace $$ts_trace; \
		poetry run cairo-run --program $$file --layout starknet_with_keccak --memory_file $$py_memory --trace_file $$py_trace; \
		$(CAIRO_VM_RS_CLI) $$file --layout all_cairo --memory_file $$rs_memory --trace_file $$rs_trace; \
		$(CAIRO_VM_ZIG_CLI) execute --filename $$file --layout all_cairo --enable-trace --output-memory $$zig_memory --output-trace $$zig_trace; \
		compare memory -s $$ts_memory $$rs_memory $$py_memory $$zig_memory; \
		exit_code_mem=$$?; \
		compare trace  -s $$ts_trace $$rs_trace $$py_trace $$zig_trace; \
		exit_code_trace=$$?; \
		if [ $$exit_code_mem -ne 0 ] || [ $$exit_code_trace -ne 0 ]; then \
			failed_tests_ctr=$$((failed_tests_ctr + 1)); \
			failed_tests="$$failed_tests $$file"; \
		else \
			passed_tests_ctr=$$((passed_tests_ctr + 1)); \
		fi; \
	done; \
	if [ $$failed_tests_ctr -ne 0 ];  then \
		echo "$$failed_tests_ctr/$$((passed_tests_ctr + failed_tests_ctr)) tests failed: "; \
		for file in $$failed_tests; do \
			echo $$file; \
		done; \
	else \
		echo "All $$passed_tests_ctr tests passed."; \
	fi

bench: $(COMPILED_CAIRO_0_BENCHMARK_FILES)
	@TMP_DIR=$(shell mktemp -d -t $(TMP_PREFIX)-bench.XXXXXXXX); \
	echo "TMP_DIR: $$TMP_DIR"; \
	for file in $^; do \
		md_output=$$TMP_DIR/$$(basename $$file .json)_bench.md; \
		json_output=$$TMP_DIR/$$(basename $$file .json)_bench.json; \
		hyperfine --warmup 2 \
		"$(CAIRO_VM_RS_CLI) $$file --layout all_cairo" \
		"$(CAIRO_VM_ZIG_CLI) execute --filename $$file --layout all_cairo" \
		"cairo run $$file" \
		"poetry run cairo-run --layout starknet_with_keccak --program $$file" \
		--export-markdown $$md_output \
		--export-json $$json_output; \
	done

clean-diff-test:
	@rm -rf /tmp/$(TMP_PREFIX)-diff-test*

clean-bench:
	@rm -rf /tmp/$(TMP_PREFIX)-bench*

clean-artifacts:
	@find cairo_programs -type f \( -name "*.json" -o -name "*.sierra" \) -delete

clean-tmp: clean-diff-test clean-bench
