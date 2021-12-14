#!/bin/bash
source ./assertions.sh

expectJsonAttr "should send a message to the forward queue" \
  "$(docker-compose exec localstack awslocal sqs send-message \
  --queue-url http://localstack:4566/queue/myForwardQueue \
  --message-body "A plain message")" \
  ".MD5OfMessageBody" \
  "fa9b57eb3202f864c8ebbad0c9744092"

expectJsonAttr "should receive message containing" \
  "$(docker-compose exec localstack awslocal sqs receive-message \
  --queue-url http://localstack:4566/queue/myForwardQueue)" \
  ".Messages[].Body" \
  "A plain message"

reportAssertions