TESTS = test/**/**/*.test.js
REPORTER = spec
TIMEOUT = 60000
ISTANBUL = ./node_modules/.bin/istanbul
MOCHA = ./node_modules/.bin/_mocha


test:
	@NODE_ENV=test $(MOCHA) -R $(REPORTER) -t $(TIMEOUT) \
		$(MOCHA_OPTS) \
		$(TESTS)

test-cov:
	@NODE_ENV=test $(ISTANBUL) cover --report html $(MOCHA) -- -R $(REPORTER) -t $(TIMEOUT) \
	$(MOCHA_OPTS) $(TESTS)

clean:
	rm -rf coverage

test-all: test-cov clean

.PHONY: test