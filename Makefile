TMP_PREFIX="cairo-vm-ts"

CAIRO_0_PATH=cairo_programs/cairo_0
CAIRO_0_FILES:=$(shell find $(CAIRO_0_PATH) -name '*.cairo')
VALID_CAIRO_0_FILES=$(shell find $(CAIRO_0_PATH) -name '*.cairo' -not -path "**/bad_programs/*")
COMPILED_CAIRO_0_FILES:=$(CAIRO_0_FILES:%.cairo=%.json)
VALID_COMPILED_CAIRO_0_FILES:=$(VALID_CAIRO_0_FILES:%.cairo=%.json)

compile: $(COMPILED_CAIRO_0_FILES)

%.json: %.cairo
	poetry run cairo-compile $< --output $@

run_all: $(VALID_COMPILED_CAIRO_0_FILES)
	@TMP_DIR=$(shell mktemp -d -t $(TMP_PREFIX)-XXXXXXXX); \
	echo "TMP_DIR: $$TMP_DIR"; \
	for file in $^; do \
		echo "Running $$file..."; \
		mem_file=$$TMP_DIR/$$(basename $$file .json)_memory.bin; \
		trace_file=$$TMP_DIR/$$(basename $$file .json)_trace.bin; \
		cairo run -s $$file --export-memory $$mem_file --export-trace $$trace_file; \
	done
