.PHONY: compile run-all diff-test bench build build-cairo-vm-cli build-cairo-vm-rs-cli build-cairo-vm-zig-cli clean-diff-test clean--bench clean-tmp

# Clone & build the other VMs - Assume that related lang are installed
CAIRO_VM_RS_CLI:=cairo-vm/target/release/cairo-vm-cli
CAIRO_VM_ZIG_CLI:=ziggy-starkdust/zig-out/bin/ziggy-starkdust

$(CAIRO_VM_RS_CLI):
	@git submodule init; \
	git submodule update; \
	cd cairo-vm; cargo build --release --bin cairo-vm-cli

$(CAIRO_VM_ZIG_CLI):
	@git submodule init; \
	git submodule update; \
	cd ziggy-starkdust; zig build

build:
	@bun install; bun link

build-cairo-vm-rs-cli: | $(CAIRO_VM_RS_CLI)

build-cairo-vm-zig-cli: | $(CAIRO_VM_ZIG_CLI)

build-cairo-vm-cli: build build-cairo-vm-rs-cli build-cairo-vm-zig-cli

TMP_PREFIX="cairo-vm-ts"

CAIRO_0_PATH=cairo_programs/cairo_0
CAIRO_0_BENCHMARK_PATH=cairo_programs/cairo_0/benchmarks
CAIRO_0_FILES:=$(shell find $(CAIRO_0_PATH) -name '*.cairo')
CAIRO_0_BENCHMARK_FILES:=$(shell find $(CAIRO_0_BENCHMARK_PATH) -name '*.cairo')
VALID_CAIRO_0_FILES=$(shell find $(CAIRO_0_PATH) -maxdepth 1 -name '*.cairo' -not -name 'range_check96_builtin.cairo')
COMPILED_CAIRO_0_FILES:=$(CAIRO_0_FILES:%.cairo=%.json)
COMPILED_CAIRO_0_BENCHMARK_FILES:=$(CAIRO_0_BENCHMARK_FILES:%.cairo=%.json)
VALID_COMPILED_CAIRO_0_FILES:=$(VALID_CAIRO_0_FILES:%.cairo=%.json)

compile: $(COMPILED_CAIRO_0_FILES)

%.json: %.cairo
	poetry run cairo-compile $< --output $@

run-all: $(VALID_COMPILED_CAIRO_0_FILES)
	@failed_tests_ctr=0; \
	failed_tests=""; \
	passed_tests_ctr=0; \
	for file in $^; do \
		echo "Running $$file..."; \
		cairo run -s $$file; \
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

clean-tmp: clean-diff-test clean-bench
