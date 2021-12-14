#!/bin/bash

source ./assertions.sh

expectJsonAttr "should execute simple lambda" \
  "$(docker-compose exec localstack awslocal lambda invoke \
  --function-name SimpleEventLambda \
  --payload '{"message":"test 123"}' \
  output.json)" \
  ".StatusCode" \
  "200"

expectEquals "should execute simple lambda" \
  "$(docker-compose exec localstack cut -d'"' -f2 output.json | strings)" \
  "test 123"

reportAssertions