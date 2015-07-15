jshint:
	./node_modules/.bin/jshint benchmark lib test

test: clean
	./node_modules/.bin/mocha --reporter spec

clean:
	rm -rf ln.log*

all: clean jshint test

.PHONY: test
