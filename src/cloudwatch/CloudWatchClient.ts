import type {
    CloudWatchClientConfig,
    MetricDatum,
    Dimension,
    GetMetricStatisticsCommandOutput,
} from '@aws-sdk/client-cloudwatch';
import { CloudWatch, GetMetricStatisticsCommand, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

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

    private static getOptions(): CloudWatchClientConfig {
        if (process.env.LOCALSTACK_HOSTNAME && process.env.EDGE_PORT) {
            const endpoint = `${process.env.LOCALSTACK_HOSTNAME}:${process.env.EDGE_PORT}`;
            return {
                endpoint,
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

            const command: PutMetricDataCommand = new PutMetricDataCommand({
                Namespace: namespace,
                MetricData: batch,
            });
            await CloudWatchClient.getClient().send(command);
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
        const command: GetMetricStatisticsCommand = new GetMetricStatisticsCommand({
            StartTime: startTime,
            EndTime: endTime,
            Period: days * CloudWatchClient.DAY_SECONDS,
            Statistics: ['Average'],
            Namespace: namespace,
            MetricName: metricName,
            Dimensions: [dimension],
        });

        const response: GetMetricStatisticsCommandOutput = await CloudWatchClient.getClient().send(command);

        return !response.Datapoints || response.Datapoints.length == 0 || !response.Datapoints[0].Average
            ? 0
            : response.Datapoints[0].Average;
    }
}
