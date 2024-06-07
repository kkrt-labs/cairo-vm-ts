CAIRO_0_PATH=cairo_programs/cairo_0
CAIRO_0_FILES:=$(wildcard $(CAIRO_0_PATH)/**/*.cairo)
COMPILED_CAIRO_0_FILES:=$(CAIRO_0_FILES:%.cairo=%.json)

compile: $(COMPILED_CAIRO_0_FILES)

%.json: %.cairo
	poetry run cairo-compile $< --output $@
