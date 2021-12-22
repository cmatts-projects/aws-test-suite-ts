#!/bin/bash

source ./assertions.sh

Scenario "Simple lambda should produce output"

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

Scenario "SQS event lambda should forward message"

Given "the my queue is empty" \
  "$(docker-compose exec localstack awslocal sqs purge-queue \
  --queue-url http://localstack:4566/000000000000/myQueue)"

And "the forward queue is empty" \
  "$(docker-compose exec localstack awslocal sqs purge-queue \
  --queue-url http://localstack:4566/000000000000/myForwardQueue)"

When "a message is sent to my queue" \
  "$(docker-compose exec localstack awslocal sqs send-message \
  --queue-url http://localstack:4566/000000000000/myQueue \
  --message-body "A forwarded message")" \
  "73b934d7b9c75692827088d63c57d6fb" \
  ".MD5OfMessageBody"

Then "the message will be forwarded to the forward queue" \
  "$(docker-compose exec localstack awslocal sqs receive-message \
  --wait-time-seconds 20 \
  --queue-url http://localstack:4566/000000000000/myForwardQueue)" \
  "A forwarded message" \
  ".Messages[].Body"
