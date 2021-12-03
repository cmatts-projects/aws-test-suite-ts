import { CloudWatch } from 'aws-sdk';
import {
    ClientConfiguration,
    Dimension,
    MetricDatum,
    PutMetricDataInput,
    GetMetricStatisticsInput,
    GetMetricStatisticsOutput,
} from 'aws-sdk/clients/cloudwatch';

export default class CloudWatchClient {
    private static readonly BATCH_SIZE: number = 25;
    private static readonly DAY_SECONDS: number = 86400;
    private static client: CloudWatch | undefined;

    public static getClient(): CloudWatch {
        if (CloudWatchClient.client) {
            return CloudWatchClient.client;
        }

        CloudWatchClient.client = new CloudWatch(CloudWatchClient.getOptions());
        return CloudWatchClient.client;
    }

    private static getOptions(): ClientConfiguration {
        if (process.env.AWS_LOCAL_ENDPOINT) {
            return {
                endpoint: process.env.AWS_LOCAL_ENDPOINT,
                region: process.env.AWS_REGION,
            };
        }
        return {};
    }

    public static createMetric(
        dimensionName: string,
        dimensionValue: string,
        metricName: string,
        value: number,
    ): MetricDatum {
        const dimension: Dimension = {
            Name: dimensionName,
            Value: dimensionValue,
        };
        return {
            MetricName: metricName,
            Value: value,
            Unit: 'Count',
            Dimensions: [dimension],
        };
    }

    public static async logMetrics(namespace: string, metrics: MetricDatum[]): Promise<void> {
        for (let i = 0; i < metrics.length; i += CloudWatchClient.BATCH_SIZE) {
            const batch = metrics.slice(i, i + CloudWatchClient.BATCH_SIZE);

            const params: PutMetricDataInput = {
                MetricData: batch,
                Namespace: namespace,
            };
            await CloudWatchClient.getClient().putMetricData(params).promise();
        }
    }

    public static async getAverageForDays(
        namespace: string,
        dimensionName: string,
        dimensionValue: string,
        metricName: string,
        days: number,
    ): Promise<number> {
        const endTime: Date = new Date();
        const startTime: Date = new Date();
        startTime.setDate(startTime.getDate() - days);

        const dimension: Dimension = {
            Name: dimensionName,
            Value: dimensionValue,
        };
        const request: GetMetricStatisticsInput = {
            StartTime: startTime,
            EndTime: endTime,
            Period: days * CloudWatchClient.DAY_SECONDS,
            Statistics: ['Average'],
            Namespace: namespace,
            MetricName: metricName,
            Dimensions: [dimension],
        };

        const response: GetMetricStatisticsOutput = await CloudWatchClient.getClient()
            .getMetricStatistics(request)
            .promise();

        return !response.Datapoints || response.Datapoints.length == 0 || !response.Datapoints[0].Average
            ? 0
            : response.Datapoints[0].Average;
    }
}
