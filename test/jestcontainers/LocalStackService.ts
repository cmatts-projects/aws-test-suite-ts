enum LocalStackService {
    DYNAMO_DB = 'dynamodb',
    CLOUDWATCH = 'cloudwatch',
    CLOUD_FORMATION = 'cloudformation',
    PARAMETER_STORE = 'ssm',
    S3 = 's3',
    SECRETS_MANAGER = 'secretsmanager',
    SQS = 'sqs',
}
export default LocalStackService;
