#!/bin/bash

source ./assertions.sh

Scenario "SQS service should send and receive messages"

Given "the queue is empty" \
  "$(docker-compose exec localstack awslocal sqs purge-queue \
  --queue-url http://localstack:4566/000000000000/myForwardQueue)"

When "a message is sent to the forward queue" \
  "$(docker-compose exec localstack awslocal sqs send-message \
  --queue-url http://localstack:4566/000000000000/myForwardQueue \
  --message-body "A plain message")" \
  "fa9b57eb3202f864c8ebbad0c9744092" \
  ".MD5OfMessageBody"

Then "the message will be received from the forward queue" \
  "$(docker-compose exec localstack awslocal sqs receive-message \
  --queue-url http://localstack:4566/000000000000/myForwardQueue)" \
  "A plain message" \
  ".Messages[].Body"