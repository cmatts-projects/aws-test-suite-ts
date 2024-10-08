# AWS Test Suite for Typescript

The AWS Test Suite is a testing repository for AWS services using AWS SDK V3 for Typescript.
This repo contains sample implementations of AWS features and services along with a Localstack test implementation of those services.

# Pre-requisites

Docker must be installed and configured so that the current user can invoke containers. On Linux, this means adding docker and the user to a docker group.
Node 18+ must be installed.
Npm 8+ must be installed.
Jq is required for Docker compose testing.
Terraform is required for Terraform deployment testing.
terraform-local is required for Terraform deployment testing.

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
* `testDeployCF` - to test deployment to localstack using Cloudformation
* `testDeployTF` - to test deployment to localstack using Terraform

# Services
## DynamoDB
The dynamoDB sample demonstrates how to create dynamo tables using Cloudformation and read and write to those tables.

Features:
* Cloudformation definition of tables
* Bulk loading data
* Searching by Partition key
* Searching by GSI
* Transactions
* Localstack test container creation for DynamoDB and Cloudformation

## Cloudwatch
The cloudwatch sample demonstrates some basic logging of cloudwatch metrics and extracting statistics.

Features:
* Bulk logging of metrics
* Getting average statistics from metrics

## S3
The S3 sample demonstrates how to store and retrieve content in an S3 bucket.

Features:
* Creation of an S3 bucket
* Verifying that a bucket exists
* Writing content to S3
* Reading content from S3
* Verifying that an S3 object exists

## Secrets Manager
The secrets manager samples demonstrate how to create, read and update secrets.

Features:
* Creation of a secret
* Updating a secret
* Reading a secret

## Parameter Store
The parameter store samples demonstrate how to create and read parameters.

Features:
* Creation of a parameter
* Reading a parameter

## SQS
The Sqs samples demonstrate how to create queues and send and receive messages.

Features:
* Creation of a queue
* Sending messages to a queue
* Receiving messages from a queue
* S3 support for large messages
* Queue purging

## Lambda
The Lambda samples demonstrate how to handle events from a variety of sources.

Features:
* Simple object event handling
* Sqs event handling
* Extended Sqs event handling

# Dockerisation
The `docker` folder contains a sample `docker-compose` definition to deploy and test the stack with localstack.

Features:
* Configuration of lambda deployment to a child container
* Aws cloudformation package and deployment
* Terraform package and deployment
* BDD style bash testing
* Test stack creation
* Test lambdas
* Test SQS Service
* Test DynamoDB Service

# Cloudformation
The `cloudformation` folder contains sample component templates.

Features:
* Nested template structure
* Queue template
* Lambda template 
* DynamoDB template

# Terraform
The `terraform` folder contains a sample resource template.

Features:
* Queue resources
* Lambda resources
* DynamoDB resources
