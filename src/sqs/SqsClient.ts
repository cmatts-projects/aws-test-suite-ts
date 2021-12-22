import { SQS } from 'aws-sdk';
import {
    ClientConfiguration,
    CreateQueueRequest,
    GetQueueUrlRequest,
    GetQueueUrlResult,
    Message,
    PurgeQueueRequest,
    ReceiveMessageRequest,
    ReceiveMessageResult,
    SendMessageBatchRequest,
    SendMessageBatchRequestEntry,
    SendMessageRequest,
} from 'aws-sdk/clients/sqs';
import { v4 as getUuid } from 'uuid';
import S3Client from '@/s3/S3Client';

export default class SqsClient {
    private static readonly BATCH_SIZE: number = 25;
    private static readonly MAX_MESSAGE_SIZE: number = 256000;
    private static readonly LARGE_PAYLOAD_ID: string = 'software.amazon.payloadoffloading.PayloadS3Pointer';
    private static readonly LARGE_MESSAGE_EXP: RegExp = new RegExp(`^\\["${SqsClient.LARGE_PAYLOAD_ID}",(.*)\\]$`);
    private readonly extendedClientBucket: string | undefined;

    private client: SQS | undefined;

    public constructor(extendedClientBucket: string | undefined) {
        this.extendedClientBucket = extendedClientBucket;
    }

    private getSqsClient(): SQS {
        if (this.client) {
            return this.client;
        }

        this.client = new SQS(SqsClient.getOptions());
        return this.client;
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

    public async createQueue(queueName: string): Promise<void> {
        const params: CreateQueueRequest = {
            QueueName: queueName,
        };
        await this.getSqsClient().createQueue(params).promise();
    }

    public async purgeQueue(queueName: string): Promise<void> {
        const params: PurgeQueueRequest = {
            QueueUrl: await this.getQueueUrl(queueName),
        };
        await this.getSqsClient().purgeQueue(params).promise();
    }

    public async sendToQueue(queueName: string, message: string): Promise<void> {
        const params: SendMessageRequest = {
            QueueUrl: await this.getQueueUrl(queueName),
            MessageBody: message,
        };
        await this.getSqsClient().sendMessage(params).promise();
    }

    public async readFromQueue(queueName: string): Promise<string[]> {
        const params: ReceiveMessageRequest = {
            QueueUrl: await this.getQueueUrl(queueName),
        };
        const response: ReceiveMessageResult = await this.getSqsClient().receiveMessage(params).promise();

        return !response.Messages ? [] : response.Messages.map((m: Message) => <string>m.Body);
    }

    public async sendToExtendedQueue(queueName: string, messages: string[]): Promise<void> {
        for (let i = 0; i < messages.length; i += SqsClient.BATCH_SIZE) {
            const batch: SendMessageBatchRequestEntry[] = await Promise.all(
                messages
                    .slice(i, i + SqsClient.BATCH_SIZE)
                    .map(async (message: string) => await this.messagePayload(message)),
            );

            const params: SendMessageBatchRequest = {
                QueueUrl: await this.getQueueUrl(queueName),
                Entries: batch,
            };
            await this.getSqsClient().sendMessageBatch(params).promise();
        }
    }

    private async messagePayload(message: string): Promise<SendMessageBatchRequestEntry> {
        let uuid: string = getUuid();
        let messageBody: string = message;

        if (Buffer.byteLength(message, 'utf8') > SqsClient.MAX_MESSAGE_SIZE) {
            uuid = await this.storeOriginalMessage(message);
            messageBody = this.largeMessagePayload(uuid);
        }

        return {
            Id: uuid,
            MessageBody: messageBody,
        };
    }

    public largeMessagePayload(uuid: string): string {
        return `["${SqsClient.LARGE_PAYLOAD_ID}",{"s3BucketName":"${this.extendedClientBucket}","s3Key":"${uuid}"}]`;
    }

    public async readFromExtendedQueue(queueName: string): Promise<string[]> {
        const messages = await this.readFromQueue(queueName);
        return Promise.all(messages.map(async (message: string) => await this.toOriginalMessage(message)));
    }

    public async toOriginalMessage(message: string): Promise<string> {
        const match: RegExpExecArray | null = SqsClient.LARGE_MESSAGE_EXP.exec(message);
        if (!match) {
            return message;
        }

        const largeMessagePayload = JSON.parse(match[1]);
        const s3Url = SqsClient.getLargeMessageS3Url(largeMessagePayload.s3BucketName, largeMessagePayload.s3Key);
        return await S3Client.readFromBucket(s3Url);
    }

    public async storeOriginalMessage(message: string): Promise<string> {
        if (!this.extendedClientBucket) {
            throw new Error('Extended client bucket is not defined.');
        }
        const uuid: string = getUuid();
        const url: string = SqsClient.getLargeMessageS3Url(this.extendedClientBucket, uuid);
        await S3Client.writeToBucket(url, message);
        return uuid;
    }

    private static getLargeMessageS3Url(bucket: string, uuid: string): string {
        return `s3://${bucket}/${uuid}`;
    }

    private async getQueueUrl(queueName: string): Promise<string> {
        const params: GetQueueUrlRequest = {
            QueueName: queueName,
        };

        const response: GetQueueUrlResult = await this.getSqsClient().getQueueUrl(params).promise();
        if (!response.QueueUrl) {
            throw new Error('Can not get queue url');
        }

        return response.QueueUrl;
    }
}
