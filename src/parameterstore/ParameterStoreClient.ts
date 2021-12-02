import { SSM } from 'aws-sdk';
import { ClientConfiguration, GetParameterRequest, GetParameterResult, PutParameterRequest } from 'aws-sdk/clients/ssm';

export default class ParameterStoreClient {
    private static client: SSM | undefined;

    public static getClient(): SSM {
        if (ParameterStoreClient.client) {
            return ParameterStoreClient.client;
        }

        ParameterStoreClient.client = new SSM(ParameterStoreClient.getOptions());
        return ParameterStoreClient.client;
    }

    private static getOptions(): ClientConfiguration {
        if (process.env.AWS_LOCAL_ENDPOINT) {
            return {
                endpoint: process.env.AWS_LOCAL_ENDPOINT,
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
        const params: PutParameterRequest = {
            Name: parameterName,
            Value: parameterValue,
            Description: parameterDescription,
        };

        await ParameterStoreClient.getClient().putParameter(params).promise();
    }

    public static async readParameter(parameterName: string): Promise<string | undefined> {
        try {
            const params: GetParameterRequest = {
                Name: parameterName,
            };

            const response: GetParameterResult = await ParameterStoreClient.getClient().getParameter(params).promise();
            return !response.Parameter ? '' : response.Parameter.Value;
        } catch (error) {
            return undefined;
        }
    }
}
