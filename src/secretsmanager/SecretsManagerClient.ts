import { SecretsManager } from 'aws-sdk';
import {
    ClientConfiguration,
    CreateSecretRequest,
    GetSecretValueRequest,
    GetSecretValueResponse,
    PutSecretValueRequest,
} from 'aws-sdk/clients/secretsmanager';

export default class SecretsManagerClient {
    private static client: SecretsManager | undefined;

    public static getClient(): SecretsManager {
        if (SecretsManagerClient.client) {
            return SecretsManagerClient.client;
        }

        SecretsManagerClient.client = new SecretsManager(SecretsManagerClient.getOptions());
        return SecretsManagerClient.client;
    }

    private static getOptions(): ClientConfiguration {
        if (process.env.LOCALSTACK_HOSTNAME && process.env.EDGE_PORT) {
            const endpoint = `${process.env.LOCALSTACK_HOSTNAME}:${process.env.EDGE_PORT}`;
            return {
                endpoint,
                region: process.env.AWS_REGION,
            };
        }
        return {};
    }

    public static async createSecret(secretName: string, secretValue: string): Promise<void> {
        const params: CreateSecretRequest = {
            Name: secretName,
            SecretString: secretValue,
        };

        await SecretsManagerClient.getClient().createSecret(params).promise();
    }

    public static async updateSecret(secretName: string, secretValue: string): Promise<void> {
        const params: PutSecretValueRequest = {
            SecretId: secretName,
            SecretString: secretValue,
        };

        await SecretsManagerClient.getClient().putSecretValue(params).promise();
    }

    public static async readSecret(secretName: string): Promise<string | undefined> {
        try {
            const params: GetSecretValueRequest = {
                SecretId: secretName,
            };

            const response: GetSecretValueResponse = await SecretsManagerClient.getClient()
                .getSecretValue(params)
                .promise();
            return response.SecretString;
        } catch (error) {
            return undefined;
        }
    }
}
