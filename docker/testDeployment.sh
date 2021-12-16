#!/bin/bash

source ./assertions.sh

Scenario "Test stack creation"

When "stack deploy is invoked" "$(./deployStack.sh)"

Then "the stack will be created" \
  "$(docker-compose exec localstack awslocal cloudformation describe-stacks --stack-name cloudformation-test)" \
  "CREATE_COMPLETE" \
  ".Stacks[].StackStatus"
