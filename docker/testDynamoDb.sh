#!/bin/bash

source ./assertions.sh

Scenario "DynamoDb should create read and update"

Given "facts are loaded" \
  "$(docker-compose exec localstack awslocal dynamodb batch-write-item --request-items file:///opt/dist/resources/batch-write-items.json)" \

When "a fact is updated" \
  "$(docker-compose exec localstack awslocal dynamodb transact-write-items --transact-items file:///opt/dist/resources/transaction-write-items.json)"

Then "the retrieved fact is updated" \
  "$(docker-compose exec localstack awslocal dynamodb query  \
    --table-name 'dynamo.example.facts' \
    --no-consistent-read \
    --index-name 'personIndex' \
    --key-condition-expression 'personId = :id' \
    --expression-attribute-values '{ ":id": { "N": "21" } }')" \
  "Updated A changed description" \
  ".Items[] | \"\(.image.S) \(.description.S)\""
