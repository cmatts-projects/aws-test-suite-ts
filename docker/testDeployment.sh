#!/bin/bash

source ./assertions.sh

describe "Test stack creation"

expectJsonAttr "should have created the stack" \
  "$(docker-compose exec localstack awslocal cloudformation describe-stacks --stack-name cloudformation-test)" \
  ".Stacks[].StackStatus" \
  "CREATE_COMPLETE"
