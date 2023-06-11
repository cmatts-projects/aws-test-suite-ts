import type { GetSecretValueCommandOutput, SecretsManagerClientConfig } from '@aws-sdk/client-secrets-manager';
import {
    SecretsManager,
    CreateSecretCommand,
    GetSecretValueCommand,
    PutSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

export default class SecretsManagerClient {
    private static client: SecretsManager | undefined;

    public static getClient(): SecretsManager {
        if (SecretsManagerClient.client) {
            return SecretsManagerClient.client;
        }

        SecretsManagerClient.client = new SecretsManager(SecretsManagerClient.getOptions());
        return SecretsManagerClient.client;
    }

    private static getOptions(): SecretsManagerClientConfig {
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
        const command: CreateSecretCommand = new CreateSecretCommand({
            Name: secretName,
            SecretString: secretValue,
        });

        await SecretsManagerClient.getClient().send(command);
    }

    public static async updateSecret(secretName: string, secretValue: string): Promise<void> {
        const command: PutSecretValueCommand = new PutSecretValueCommand({
            SecretId: secretName,
            SecretString: secretValue,
        });

        await SecretsManagerClient.getClient().send(command);
    }

    public static async readSecret(secretName: string): Promise<string | undefined> {
        try {
            const command: GetSecretValueCommand = new GetSecretValueCommand({
                SecretId: secretName,
            });

            const response: GetSecretValueCommandOutput = await SecretsManagerClient.getClient().send(command);
            return response.SecretString;
        } catch (error) {
            return undefined;
        }
    }
}
