#!/bin/bash

source ./assertions.sh

echo Creating a bucket to upload cloudformation to
docker-compose exec localstack awslocal s3 mb s3://cloudformation

echo Deploying Cloudformation scripts to localstack
docker-compose exec localstack awslocal cloudformation package \
  --template-file //opt/dist/template.yml \
  --s3-bucket cloudformation \
  --output-template-file deploy.yml

docker-compose exec localstack awslocal cloudformation deploy \
  --stack-name cloudformation-test \
  --template-file deploy.yml

expectJsonAttr "should have created the stack" \
  "$(docker-compose exec localstack awslocal cloudformation describe-stacks --stack-name cloudformation-test)" \
  ".Stacks[].StackStatus" \
  "CREATE_COMPLETE"

reportAssertions