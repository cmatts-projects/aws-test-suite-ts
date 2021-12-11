#!/bin/bash

function waitForContainerToStart() {
  until docker logs localstack | grep -q -m 1 "^Ready.$"; do
    printf '.'
    sleep 1
  done
  echo
}

cp -r ../cloudformation/* ../dist

echo Start container
docker-compose up -d

waitForContainerToStart

echo "Localstack started."

echo Deploying Cloudformation scripts to localstack
docker-compose exec localstack awslocal s3 mb s3://cloudformation

docker-compose exec localstack awslocal cloudformation package \
  --template-file //opt/dist/template.yml \
  --s3-bucket cloudformation \
  --output-template-file deploy.yml

docker-compose exec localstack awslocal cloudformation deploy \
  --stack-name cloudformation-test \
  --template-file deploy.yml

echo Show stack details
docker-compose exec localstack awslocal cloudformation describe-stacks --stack-name cloudformation-test

echo Send a message to the forward queue
docker-compose exec localstack awslocal sqs send-message \
  --queue-url http://localstack:4566/queue/myForwardQueue \
  --message-body "A plain message"

echo Receive a message from the forward queue
docker-compose exec localstack awslocal sqs receive-message \
  --queue-url http://localstack:4566/queue/myForwardQueue

docker-compose exec localstack awslocal lambda invoke \
  --function-name SimpleEventLambda \
  --payload '{"message":"test 123"}' \
  output.json


#echo "Stopping Localstack."
#docker-compose down
