eslint:
	./node_modules/.bin/eslint benchmark lib test

test: clean
	./node_modules/.bin/mocha ./test/test.js --reporter spec
	node ./test/cluster.test.js

clean:
	git clean -xf

all: clean eslint test

.PHONY: test
