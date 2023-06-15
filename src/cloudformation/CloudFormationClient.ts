import type {
    CloudFormationClientConfig,
    CreateStackCommandInput,
    DescribeStacksCommandInput,
    DescribeStacksCommandOutput,
} from '@aws-sdk/client-cloudformation';
import { CloudFormation, CreateStackCommand, DescribeStacksCommand, StackStatus } from '@aws-sdk/client-cloudformation';

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
        await CloudFormationClient.getClient().send(new CreateStackCommand(params));
        await this.waitForStackCreation(stackName);
    }

    public static async describeStacks(stackName: string): Promise<DescribeStacksCommandOutput> {
        const params: DescribeStacksCommandInput = {
            StackName: stackName,
        };
        return await CloudFormationClient.getClient().send(new DescribeStacksCommand(params));
    }

    public static async waitForStackCreation(stackName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject('Stack not created.');
            }, 60000);

            const checkStatusTimer = setInterval(async () => {
                const describeStacks = await this.describeStacks(stackName);
                if (describeStacks.Stacks && describeStacks.Stacks[0].StackStatus === StackStatus.CREATE_COMPLETE) {
                    clearTimeout(timer);
                    clearTimeout(checkStatusTimer);
                    resolve();
                }
            }, 500);
        });
    }
}
