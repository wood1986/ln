jshint:
	./node_modules/.bin/jshint benchmark lib test

test:
	ulimit -n 512
	./node_modules/.bin/mocha --reporter spec

clean:
	rm -rf ln.log*

all: clean jshint test

.PHONY: test
