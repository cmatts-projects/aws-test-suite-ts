import type { CloudFormationClientConfig, CreateStackCommandInput } from '@aws-sdk/client-cloudformation';
import { CloudFormation } from '@aws-sdk/client-cloudformation';

export default class CloudFormationClient {
    private static client: CloudFormation | undefined;

    public static getClient(): CloudFormation {
        if (CloudFormationClient.client) {
            return CloudFormationClient.client;
        }

        CloudFormationClient.client = new CloudFormation(CloudFormationClient.getOptions());
        return CloudFormationClient.client;
    }

    private static getOptions(): CloudFormationClientConfig {
        if (process.env.LOCALSTACK_HOSTNAME && process.env.EDGE_PORT) {
            const endpoint = `http://${process.env.LOCALSTACK_HOSTNAME}:${process.env.EDGE_PORT}`;
            return {
                endpoint,
                region: process.env.AWS_REGION,
            };
        }
        return {};
    }

    public static async createStack(stackName: string, content: string): Promise<void> {
        const params: CreateStackCommandInput = {
            StackName: stackName,
            TemplateBody: content,
        };
        await CloudFormationClient.getClient().createStack(params);
    }
}
