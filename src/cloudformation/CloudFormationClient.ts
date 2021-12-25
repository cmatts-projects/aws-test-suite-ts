import { CloudFormation } from 'aws-sdk';
import { ClientConfiguration } from 'aws-sdk/clients/cloudformation';
import { CreateStackInput } from 'aws-sdk/clients/cloudformation';

export default class CloudFormationClient {
    private static client: CloudFormation | undefined;

    public static getClient(): CloudFormation {
        if (CloudFormationClient.client) {
            return CloudFormationClient.client;
        }

        CloudFormationClient.client = new CloudFormation(CloudFormationClient.getOptions());
        return CloudFormationClient.client;
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

    public static async createStack(stackName: string, content: string): Promise<void> {
        const params: CreateStackInput = {
            StackName: stackName,
            TemplateBody: content,
        };
        await CloudFormationClient.getClient().createStack(params).promise();
    }
}
