.PHONY: compile run-all diff-test build-cairo-vm-rs-cli build-cairo-vm-go-cli build-all-cairo-vm-cli clean-tmp

# Clone & build the other VMs - Assume that related lang are installed
CAIRO_VM_RS_CLI:=cairo-vm/target/release/cairo-vm-cli
CAIRO_VM_GO_CLI:=cairo-vm-go/bin/cairo-vm

$(CAIRO_VM_RS_CLI):
	git clone --depth 1 -b v0.9.3 git@github.com:lambdaclass/cairo-vm.git
	cd cairo-vm; cargo build --release --bin cairo-vm-cli

$(CAIRO_VM_GO_CLI):
	git clone --depth 1 git@github.com:NethermindEth/cairo-vm-go.git
	cd cairo-vm-go; make build

build-cairo-vm-rs-cli: | $(CAIRO_VM_RS_CLI)

build-cairo-vm-go-cli: | $(CAIRO_VM_GO_CLI)

build-all-cairo-vm-cli: build-cairo-vm-rs-cli build-cairo-vm-go-cli

TMP_PREFIX="cairo-vm-ts"

CAIRO_0_PATH=cairo_programs/cairo_0
CAIRO_0_FILES:=$(shell find $(CAIRO_0_PATH) -name '*.cairo')
VALID_CAIRO_0_FILES=$(shell find $(CAIRO_0_PATH) -name '*.cairo' -not -path "**/bad_programs/*")
COMPILED_CAIRO_0_FILES:=$(CAIRO_0_FILES:%.cairo=%.json)
VALID_COMPILED_CAIRO_0_FILES:=$(VALID_CAIRO_0_FILES:%.cairo=%.json)

compile: $(COMPILED_CAIRO_0_FILES)

%.json: %.cairo
	poetry run cairo-compile $< --output $@

run-all: $(VALID_COMPILED_CAIRO_0_FILES)
	for file in $^; do \
		echo "Running $$file..."; \
		cairo run -s $$file; \
	done

diff-test: $(VALID_COMPILED_CAIRO_0_FILES)
	@TMP_DIR=$(shell mktemp -d -t $(TMP_PREFIX)-diff-test.XXXXXXXX); \
	echo "TMP_DIR: $$TMP_DIR"; \
	for file in $^; do \
		echo "Diff testing $$file..."; \
		ts_memory=$$TMP_DIR/$$(basename $$file .json).ts.memory; \
		py_memory=$$TMP_DIR/$$(basename $$file .json).py.memory; \
		rs_memory=$$TMP_DIR/$$(basename $$file .json).rs.memory; \
		ts_trace=$$TMP_DIR/$$(basename $$file .json).ts.trace; \
		py_trace=$$TMP_DIR/$$(basename $$file .json).py.trace; \
		rs_trace=$$TMP_DIR/$$(basename $$file .json).rs.trace; \
		cairo run $$file --silent --offset 1 --export-memory $$ts_memory --export-trace $$ts_trace; \
		poetry run cairo-run --program $$file --layout starknet_with_keccak --memory_file $$py_memory --trace_file $$py_trace; \
		$(CAIRO_VM_RS_CLI) $$file --layout=starknet_with_keccak --memory_file $$rs_memory --trace_file $$rs_trace; \
		compare memory -s $$ts_memory $$rs_memory $$py_memory $$go_memory; \
		compare trace  -s $$ts_trace $$rs_trace $$py_trace $$go_trace; \
	done

clean-tmp:
	@rm -rf /tmp/$(TMP_PREFIX)*
