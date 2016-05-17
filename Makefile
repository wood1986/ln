eslint:
	./node_modules/.bin/eslint benchmark lib test

test: clean
	./node_modules/.bin/mocha ./test/test.js --reporter spec
	node ./test/cluster.test.js

clean:
	git clean -xf

all: clean eslint test

publish:
	$(eval LEVEL := $(shell cut -d ' ' -f 1 <<< "$(LEVEL)"))
	$(eval FROM := $(shell npm view ln version))
	$(eval TO := $(shell semver $(FROM) -i $(LEVEL)))
	@echo "$(FROM) -> $(TO)"
	@read -p "Press <Enter> to continue or <Ctrl-C> to cancel..."
	npm version $(TO)
	git push
	npm publish

.PHONY: test publish
