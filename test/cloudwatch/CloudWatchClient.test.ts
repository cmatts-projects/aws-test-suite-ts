import LocalStackContainer from '../jestcontainers/LocalStackContainer';
import LocalStackService from '../jestcontainers/LocalStackService';
import CloudWatchClient from '@/cloudwatch/CloudWatchClient';
import { MetricDatum } from 'aws-sdk/clients/cloudwatch';

describe('secrets manager client test', () => {
    const NUMBER_METRICS = 100;
    const MY_NAMESPACE = 'myNamespace';
    const MY_DIMENSION = 'myDimension';
    const MY_COUNT = 'myCount';
    const MY_METRIC = 'metricName';

    let localStackContainer: LocalStackContainer | undefined;

    beforeAll(async () => {
        localStackContainer = await LocalStackContainer.create([LocalStackService.CLOUDWATCH]);

        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_ACCESS_KEY = 'access-key';
        process.env.AWS_SECRET_ACCESS_KEY = 'secret-key';
        process.env.AWS_LOCAL_ENDPOINT = localStackContainer.getEndpoint();
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    });

    afterAll(async () => {
        if (localStackContainer) {
            await localStackContainer.destroy();
        }
    });

    it('should log metrics', async () => {
        const metrics: MetricDatum[] = [];
        for (let i = 0; i < NUMBER_METRICS; i++) {
            const datum: MetricDatum = CloudWatchClient.createMetric(MY_DIMENSION, MY_COUNT, MY_METRIC, i);
            const timestamp = new Date();
            timestamp.setDate(timestamp.getDate() - i);
            datum.Timestamp = timestamp;
            metrics.push(datum);
        }

        await CloudWatchClient.logMetrics(MY_NAMESPACE, metrics);

        expect(await CloudWatchClient.getAverageForDays(MY_NAMESPACE, MY_DIMENSION, MY_COUNT, MY_METRIC, 30)).toBe(
            14.5,
        );
    });
});
