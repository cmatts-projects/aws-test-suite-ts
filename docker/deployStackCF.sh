#!/bin/bash

docker-compose exec localstack awslocal s3 mb s3://cloudformation
cp ../cloudformation/* ../dist/.

docker-compose exec localstack awslocal cloudformation package \
  --template-file //opt/dist/template.yml \
  --s3-bucket cloudformation \
  --output-template-file deploy.yml

docker-compose exec localstack awslocal cloudformation deploy \
  --stack-name cloudformation-test \
  --template-file deploy.yml
