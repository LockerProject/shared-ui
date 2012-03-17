js/compiled_templates.js: $(wildcard templates/*.html)
	node templates/compile.js $^ > $@

clean:
	rm -f js/compiled_templates.js
