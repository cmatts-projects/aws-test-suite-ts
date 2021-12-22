import LocalStackContainer from '../jestcontainers/LocalStackContainer';
import LocalStackService from '../jestcontainers/LocalStackService';
import SqsClient from '@/sqs/SqsClient';
import S3Client from '@/s3/S3Client';

describe('sqs client test', () => {
    const TEST_QUEUE_BUCKET = 'my-queue-bucket';
    const TEST_QUEUE = 'myQueue';
    const TEST_MESSAGE = 'A test message';
    const ONE_HUNDRED_MILLISECONDS = 100;
    const FIVE_SECONDS = 5000;
    const EXTENDED_MESSAGE_PAYLOAD =
        '\\["software.amazon.payloadoffloading.PayloadS3Pointer",{"s3BucketName":"my-queue-bucket","s3Key":".*"}\\]';

    let localStackContainer: LocalStackContainer | undefined;
    let sqsClient: SqsClient | undefined;

    beforeAll(async () => {
        localStackContainer = await LocalStackContainer.create([LocalStackService.SQS, LocalStackService.S3]);

        localStackContainer.setLocalstackProperties();

        await S3Client.createBucket(TEST_QUEUE_BUCKET);
        await getSqsClient().createQueue(TEST_QUEUE);
    });

    afterAll(async () => {
        if (localStackContainer) {
            await localStackContainer.destroy();
        }
    });

    beforeEach(async () => {
        await getSqsClient().purgeQueue(TEST_QUEUE);
    });

    it('should Send To Queue', async () => {
        await getSqsClient().sendToQueue(TEST_QUEUE, TEST_MESSAGE);

        const receivedMessages: string[] = await getSqsClient().readFromQueue(TEST_QUEUE);
        expect(receivedMessages).toHaveLength(1);
        expect(receivedMessages[0]).toBe(TEST_MESSAGE);
    });

    it('should Send Simple Message To Extended Queue', async () => {
        await getSqsClient().sendToExtendedQueue(TEST_QUEUE, [TEST_MESSAGE]);

        const receivedMessages: string[] = await getSqsClient().readFromQueue(TEST_QUEUE);
        expect(receivedMessages).toHaveLength(1);
        expect(receivedMessages[0]).toBe(TEST_MESSAGE);
    });

    it('should read Simple Message from Extended Queue', async () => {
        await getSqsClient().sendToQueue(TEST_QUEUE, TEST_MESSAGE);

        const receivedMessages: string[] = await getSqsClient().readFromExtendedQueue(TEST_QUEUE);
        expect(receivedMessages).toHaveLength(1);
        expect(receivedMessages[0]).toBe(TEST_MESSAGE);
    });

    it('should Send LargeMessage To Extended Queue', async () => {
        const largeMessage: string = 'X'.repeat(257 * 1024);
        await getSqsClient().sendToExtendedQueue(TEST_QUEUE, [largeMessage]);

        const receivedMessages: string[] = await getSqsClient().readFromQueue(TEST_QUEUE);
        expect(receivedMessages).toHaveLength(1);
        expect(receivedMessages[0]).toEqual(expect.stringMatching(EXTENDED_MESSAGE_PAYLOAD));
    });

    it('should Receive Large Message From Extended Queue', async () => {
        const largeMessage: string = 'X'.repeat(257 * 1024);
        await getSqsClient().sendToExtendedQueue(TEST_QUEUE, [largeMessage]);

        const receivedMessages: string[] = await getSqsClient().readFromExtendedQueue(TEST_QUEUE);
        expect(receivedMessages).toHaveLength(1);
        expect(receivedMessages[0]).toEqual(largeMessage);
    });

    it('should Send Big Message Batch To Extended Queue', async () => {
        const largeMessage: string = 'X'.repeat(250 * 1024);
        const messageBatch: string[] = [largeMessage, largeMessage, largeMessage];
        await getSqsClient().sendToExtendedQueue(TEST_QUEUE, messageBatch);

        const receivedMessages: string[] = await retrieveMessagesFromSqs(3);
        expect(receivedMessages[0]).toEqual(largeMessage);
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
            const items: string[] = await getSqsClient().readFromQueue(TEST_QUEUE);
            messages = messages.concat(items);
        }
        return messages;
    };

    const getSqsClient = (): SqsClient => {
        if (!sqsClient) {
            sqsClient = new SqsClient(TEST_QUEUE_BUCKET);
        }
        return sqsClient;
    };
});
