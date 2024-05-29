// SQS

variable runtime_test_queue {
  description = "name of the test queue"
  type = string
  default = "myQueue"
}

variable runtime_forward_queue {
  description = "name of the forward queue"
  type = string
  default = "myForwardQueue"
}

resource "aws_sqs_queue" "test_queue" {
  name                        = var.runtime_test_queue
  visibility_timeout_seconds  = 60
}

resource "aws_sqs_queue" "forward_queue" {
  name                        = var.runtime_forward_queue
  visibility_timeout_seconds  = 60
}

// Lambda

data "aws_iam_policy_document" "assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "iam_for_lambda" {
  name               = "iam_for_lambda"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_lambda_function" "simple_event_lambda" {
  filename      = "lambda.js.zip"
  function_name = "SimpleEventLambda"
  role          = aws_iam_role.iam_for_lambda.arn
  handler       = "lambda.simpleEventHandler"

  runtime = "nodejs18.x"
}

resource "aws_lambda_function" "sqs_event_lambda" {
  filename      = "lambda.js.zip"
  function_name = "SqsEventLambda"
  role          = aws_iam_role.iam_for_lambda.arn
  handler       = "lambda.sqsEventHandler"
  reserved_concurrent_executions = 1
  runtime = "nodejs18.x"

  environment {
    variables = {
      FORWARD_QUEUE = "myForwardQueue"
    }
  }
}

resource "aws_lambda_event_source_mapping" "sqs_event" {
  event_source_arn = aws_sqs_queue.test_queue.arn
  function_name    = aws_lambda_function.sqs_event_lambda.arn
  batch_size       = 10
}

// Dynamo DB

resource "aws_dynamodb_table" "PeopleTable" {
  name           = "dynamo.example.people"
  billing_mode   = "PROVISIONED"
  read_capacity  = 5
  write_capacity = 5
  hash_key       = "id"

  attribute {
    name = "id"
    type = "N"
  }

  attribute {
    name = "fatherId"
    type = "N"
  }

  attribute {
    name = "motherId"
    type = "N"
  }

  global_secondary_index {
    name               = "fatherIndex"
    hash_key           = "fatherId"
    write_capacity     = 5
    read_capacity      = 5
    projection_type    = "ALL"
  }

  global_secondary_index {
    name               = "motherIndex"
    hash_key           = "motherId"
    write_capacity     = 5
    read_capacity      = 5
    projection_type    = "ALL"
  }
}

resource "aws_dynamodb_table" "FactTable" {
  name           = "dynamo.example.facts"
  billing_mode   = "PROVISIONED"
  read_capacity  = 5
  write_capacity = 5
  hash_key       = "id"

  attribute {
    name = "id"
    type = "N"
  }

  attribute {
    name = "personId"
    type = "N"
  }

  global_secondary_index {
    name               = "personIndex"
    hash_key           = "personId"
    write_capacity     = 5
    read_capacity      = 5
    projection_type    = "ALL"
  }

}
