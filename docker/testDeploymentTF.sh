#!/bin/bash

source ./assertions.sh

Scenario "Stack creation"

When "stack deploy is invoked" "$(./deployStackTF.sh)"

Then "the stack will be created" \
  "$(cd ../dist && tflocal state list | tr '\n' ' ')" \
  "data.aws_iam_policy_document.assume_role aws_dynamodb_table.FactTable aws_dynamodb_table.PeopleTable aws_iam_role.iam_for_lambda aws_lambda_event_source_mapping.sqs_event aws_lambda_function.simple_event_lambda aws_lambda_function.sqs_event_lambda aws_sqs_queue.forward_queue aws_sqs_queue.test_queue "
