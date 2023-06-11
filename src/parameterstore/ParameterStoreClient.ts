import type { GetParameterResult, SSMClientConfig } from '@aws-sdk/client-ssm';
import { SSM, GetParameterCommand, PutParameterCommand } from '@aws-sdk/client-ssm';

export default class ParameterStoreClient {
    private static client: SSM | undefined;

    public static getClient(): SSM {
        if (ParameterStoreClient.client) {
            return ParameterStoreClient.client;
        }

        ParameterStoreClient.client = new SSM(ParameterStoreClient.getOptions());
        return ParameterStoreClient.client;
    }

    private static getOptions(): SSMClientConfig {
        if (process.env.LOCALSTACK_HOSTNAME && process.env.EDGE_PORT) {
            const endpoint = `${process.env.LOCALSTACK_HOSTNAME}:${process.env.EDGE_PORT}`;
            return {
                endpoint,
                region: process.env.AWS_REGION,
            };
        }
        return {};
    }

    public static async writeParameter(
        parameterName: string,
        parameterValue: string,
        parameterDescription: string,
    ): Promise<void> {
        const command: PutParameterCommand = new PutParameterCommand({
            Name: parameterName,
            Value: parameterValue,
            Description: parameterDescription,
        });

        await ParameterStoreClient.getClient().send(command);
    }

    public static async readParameter(parameterName: string): Promise<string | undefined> {
        try {
            const command: GetParameterCommand = new GetParameterCommand({
                Name: parameterName,
            });

            const response: GetParameterResult = await ParameterStoreClient.getClient().send(command);
            return !response.Parameter ? '' : response.Parameter.Value;
        } catch (error) {
            return undefined;
        }
    }
}
