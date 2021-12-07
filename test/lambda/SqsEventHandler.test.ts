import LocalStackContainer from '../jestcontainers/LocalStackContainer';
import LocalStackService from '../jestcontainers/LocalStackService';
import SqsClient from '@/sqs/SqsClient';
import SqsEventHandler from '@/lambda/SqsEventHandler';
import { SQSEvent, SQSRecord } from 'aws-lambda/trigger/sqs';
import { v4 as getUuid } from 'uuid';

describe('Sqs Event Handler Test', () => {
    const TEST_QUEUE = 'myQueue';
    const TEST_MESSAGE = 'A test message';
    const ONE_HUNDRED_MILLISECONDS = 100;
    const FIVE_SECONDS = 5000;

    let sqsClient: SqsClient | undefined;
    let localStackContainer: LocalStackContainer | undefined;

    beforeAll(async () => {
        localStackContainer = await LocalStackContainer.create([LocalStackService.SQS]);

        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_ACCESS_KEY = 'access-key';
        process.env.AWS_SECRET_ACCESS_KEY = 'secret-key';
        process.env.AWS_LOCAL_ENDPOINT = localStackContainer.getEndpoint();
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        process.env.FORWARD_QUEUE = TEST_QUEUE;

        await getSqsClient().createQueue(TEST_QUEUE);
    });

    afterAll(async () => {
        if (localStackContainer) {
            await localStackContainer.destroy();
        }
    });

    it('should forward event messages', async () => {
        const event: SQSEvent = createSqsEvent();
        await SqsEventHandler.handleRequest(event);

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
            const items: string[] = await getSqsClient().readFromQueue(TEST_QUEUE);
            messages = messages.concat(items);
        }
        return messages;
    };

    const createSqsEvent = (): SQSEvent => {
        return {
            Records: createSqsMessages(),
        };
    };

    const createSqsMessages = (): SQSRecord[] => {
        return [createSqsMessage(), createSqsMessage(), createSqsMessage()];
    };

    const createSqsMessage = (): SQSRecord => {
        return {
            messageId: getUuid(),
            body: TEST_MESSAGE,
        } as SQSRecord;
    };

    const getSqsClient = (): SqsClient => {
        if (!sqsClient) {
            sqsClient = new SqsClient(undefined);
        }
        return sqsClient;
    };
});
