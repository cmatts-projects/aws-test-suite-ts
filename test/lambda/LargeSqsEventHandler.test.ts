import LocalStackContainer from '../jestcontainers/LocalStackContainer';
import LocalStackService from '../jestcontainers/LocalStackService';
import SqsClient from '@/sqs/SqsClient';
import LargeSqsEventHandler from '@/lambda/LargeSqsEventHandler';
import S3Client from '@/s3/S3Client';
import { SQSEvent, SQSRecord } from 'aws-lambda/trigger/sqs';
import { v4 as getUuid } from 'uuid';

describe('Large Sqs Event Handler Test', () => {
    const TEST_QUEUE = 'myQueue';
    const TEST_MESSAGE: string = 'X'.repeat(257 * 1024);
    const TEST_QUEUE_BUCKET = 'my-queue-bucket';
    const ONE_HUNDRED_MILLISECONDS = 100;
    const FIVE_SECONDS = 5000;

    let sqsClient: SqsClient | undefined;
    let localStackContainer: LocalStackContainer | undefined;

    beforeAll(async () => {
        localStackContainer = await LocalStackContainer.create([LocalStackService.SQS, LocalStackService.S3]);

        localStackContainer.setLocalstackProperties();
        process.env.FORWARD_QUEUE = TEST_QUEUE;
        process.env.EXTENDED_CLIENT_BUCKET = TEST_QUEUE_BUCKET;

        await S3Client.createBucket(TEST_QUEUE_BUCKET);
        await getSqsClient().createQueue(TEST_QUEUE);
    });

    afterAll(async () => {
        if (localStackContainer) {
            await localStackContainer.destroy();
        }
    });

    it('should forward large event messages', async () => {
        const event: SQSEvent = await createSqsEvent();
        await LargeSqsEventHandler.handleRequest(event);

        const receivedMessages: string[] = await retrieveMessagesFromSqs(3);
        receivedMessages.forEach((message) => expect(message).toBe(TEST_MESSAGE));
    });

    const retrieveMessagesFromSqs = async (numberOfRecords: number): Promise<string[]> => {
        let messages: string[] = [];
        let timeOut: number = FIVE_SECONDS;

        while (messages.length < numberOfRecords) {
            if (timeOut <= 0) {
                throw new Error('Timed out waiting for messages');
            }

            await new Promise((r) => setTimeout(r, ONE_HUNDRED_MILLISECONDS));
            timeOut -= ONE_HUNDRED_MILLISECONDS;
            const items: string[] = await getSqsClient().readFromExtendedQueue(TEST_QUEUE);
            messages = messages.concat(items);
        }
        return messages;
    };

    const createSqsEvent = async (): Promise<SQSEvent> => {
        return {
            Records: await createSqsMessages(),
        };
    };

    const createSqsMessages = async (): Promise<SQSRecord[]> => {
        return await Promise.all([createSqsMessage(), createSqsMessage(), createSqsMessage()]);
    };

    const createSqsMessage = async (): Promise<SQSRecord> => {
        return {
            messageId: getUuid(),
            body: await getSqsClient().largeMessagePayload(await getSqsClient().storeOriginalMessage(TEST_MESSAGE)),
        } as SQSRecord;
    };

    const getSqsClient = (): SqsClient => {
        if (!sqsClient) {
            sqsClient = new SqsClient(TEST_QUEUE_BUCKET);
        }
        return sqsClient;
    };
});
