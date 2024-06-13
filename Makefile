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
	@TMP_DIR=$(shell mktemp -d -t $(TMP_PREFIX)-XXXXXXXX); \
	echo "TMP_DIR: $$TMP_DIR"; \
	for file in $^; do \
		echo "Running $$file..."; \
		memory=$$TMP_DIR/$$(basename $$file .json).ts.memory; \
		trace=$$TMP_DIR/$$(basename $$file .json).ts.trace; \
		cairo run -s $$file --export-memory $$memory --export-trace $$trace; \
	done

ifeq ($(CAIRO_VM_RUST_BIN),)
diff-test:
	@echo "CAIRO_VM_RUST_BIN env variable must be set to the path of the cairo-vm-cli executable"
else
diff-test: $(VALID_COMPILED_CAIRO_0_FILES)
	@TMP_DIR=$(shell mktemp -d -t $(TMP_PREFIX)-XXXXXXXX); \
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
		cairo-run --program $$file --layout starknet_with_keccak --memory_file $$py_memory --trace_file $$py_trace; \
		$(CAIRO_VM_RUST_BIN) $$file --layout=starknet_with_keccak --memory_file $$rs_memory --trace_file $$rs_trace; \
		compare memory -s $$ts_memory $$rs_memory $$py_memory; \
		compare trace  -s $$ts_trace $$rs_trace $$py_trace; \
	done
endif
