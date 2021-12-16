#!/bin/bash

source ./assertions.sh

Scenario "Test Lambdas"

When "the simple lambda is invoked" \
  "$(docker-compose exec localstack awslocal lambda invoke \
  --function-name SimpleEventLambda \
  --payload '{"message":"test 123"}' \
  output.json)" \
  "200" \
  ".StatusCode"

Then "the output will match simple lambda output" \
  "$(docker-compose exec localstack cut -d'"' -f2 output.json | strings)" \
  "test 123"
