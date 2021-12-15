#!/bin/bash

source ./assertions.sh

describe "Test Lambdas"

expectJsonAttr "should execute simple lambda" \
  "$(docker-compose exec localstack awslocal lambda invoke \
  --function-name SimpleEventLambda \
  --payload '{"message":"test 123"}' \
  output.json)" \
  ".StatusCode" \
  "200"

expectEquals "should match simple lambda output" \
  "$(docker-compose exec localstack cut -d'"' -f2 output.json | strings)" \
  "test 123"
