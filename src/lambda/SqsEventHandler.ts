import SqsClient from '@/sqs/SqsClient';
import { SQSEvent, SQSRecord } from 'aws-lambda';

export default class SqsEventHandler {
    private static readonly sqsClient: SqsClient = new SqsClient(undefined);

    public static async handleRequest(event: SQSEvent): Promise<string> {
        const { Records } = event;

        await Promise.all(Records.map((r) => SqsEventHandler.doSomething(r)));

        return 'OK';
    }

    private static async doSomething(sqsRecord: SQSRecord): Promise<void> {
        if (!process.env.FORWARD_QUEUE) {
            throw new Error('Forward queue parameter not set');
        }

        await SqsEventHandler.sqsClient.sendToQueue(process.env.FORWARD_QUEUE, sqsRecord.body);
    }
}
