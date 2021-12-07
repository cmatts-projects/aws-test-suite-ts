import SqsClient from '@/sqs/SqsClient';
import { SQSEvent, SQSRecord } from 'aws-lambda';

export default class LargeSqsEventHandler {
    private static sqsClient: SqsClient | undefined;

    public static async handleRequest(event: SQSEvent): Promise<string> {
        const { Records } = event;

        await Promise.all(Records.map((r) => LargeSqsEventHandler.doSomething(r)));

        return 'OK';
    }

    private static async doSomething(sqsRecord: SQSRecord): Promise<void> {
        if (!process.env.FORWARD_QUEUE) {
            throw new Error('Forward queue parameter not set');
        }

        const originalMessage: string = await LargeSqsEventHandler.getSqsClient().toOriginalMessage(sqsRecord.body);
        await LargeSqsEventHandler.getSqsClient().sendToExtendedQueue(process.env.FORWARD_QUEUE, [originalMessage]);
    }

    private static getSqsClient(): SqsClient {
        if (!LargeSqsEventHandler.sqsClient) {
            LargeSqsEventHandler.sqsClient = new SqsClient(process.env.EXTENDED_CLIENT_BUCKET);
        }
        return LargeSqsEventHandler.sqsClient;
    }
}
