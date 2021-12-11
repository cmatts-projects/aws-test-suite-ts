# AWS Test Suite for Typescript

The AWS Test Suite is a testing repository for AWS services using Typescript.
This repo contains example implementations of AWS features and services along with a Localstack test implementation of those services.

# Pre-requisites

Docker must be installed and configured so that the current user can invoke containers. On Linux, this means adding docker and the user to a docker group.
Node 17+ must be installed.
Npm 8+ must be installed.

# Build
To build and test:
```bash
npm run build
```

Additional `npm` services are available:
* `lint` - to report linting errors
* `lint:fix` - to fix linting errors
* `test` - to run the tests
* `coverage` - to generate a coverage report
* `dist` - to generate the distribution zip
* `testDeploy` - to test deployment to localstack

# Services
## DynamoDB (TODO)
The dynamoDB example demonstrates how to create dynamo tables using Cloudformation and read and write to those tables using the DynamoDB mapper feature.

Features:
* Cloudformation definition of tables
* Bulk loading data
* Searching by Partition key
* Searching by GSI
* Use of DynamoDBMapper and annotations
* Table name prefix override configuration
* Optimistic locking
* Transactions
* Localstack test container creation for DynamoDB and Cloudformation
* Lombok based pojo's

## Cloudwatch
The cloudwatch example demonstrates some basic logging of cloudwatch metrics and extracting statistics.

Features:
* Bulk logging of metrics
* Getting average statistics from metrics

## Kinesis Streams (TODO)
The Kinesis example demonstrates how to send and retrieve messages using a Kinesis data stream.

Features:
* Creation of a stream
* Waiting for the stream to be active
* Use of a Kinesis Producer to batch message send requests
* Listening to a Kinesis stream and collecting messages

## S3
The S3 example demonstrates how to store and retrieve content in an S3 bucket.

Features:
* Creation of an S3 bucket
* Verifying that a bucket exists
* Writing content to S3
* Reading content from S3
* Verifying that an S3 object exists

## Secrets Manager
The secrets manager examples demonstrate how to create, read and update secrets.

Features:
* Creation of a secret
* Updating a secret
* Reading a secret

## Parameter Store
The parameter store examples demonstrate how to create and read parameters.

Features:
* Creation of a parameter
* Reading a parameter

## SQS
The Sqs examples demonstrate how to create queues and send and receive messages.

Features:
* Creation of a queue
* Sending messages to a queue
* Receiving messages from a queue
* S3 support for large messages
* Queue purging

## Lambda
The Lambda examples demonstrate how to handle events from a variety of sources.

Features:
* Simple object event handling
* Sqs event handling
* Extended Sqs event handling

# Dockerisation
The `docker` folder contains a sample `docker-compose` definition to deploy and test the stack with localstack.

Features:
* Configuration of Lambda deployment to a child container
* Aws cloudformation package and deployment
* S3 bucket creation
* Lambda invocation
* Queue sending and receiving

# Cloudformation
The `cloudformation` folder contains sample component templates.

Features:
* Nested template structure
* Queue template
* Lambda template 
