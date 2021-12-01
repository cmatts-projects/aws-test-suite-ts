enum LocalStackService {
    DYNAMO_DB = 'dynamodb',
    CLOUDWATCH = 'cloudwatch',
    CLOUD_FORMATION = 'cloudformation',
    KINESIS = 'kinesis',
    PARAMETER_STORE = 'ssm',
    S3 = 's3',
    SECRETS_MANAGER = 'secretsmanager',
    SQS = 'sqs',
    STEP_FUNCTION = 'stepfunction',
}
export default LocalStackService;
