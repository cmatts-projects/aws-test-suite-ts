import { S3 } from 'aws-sdk';
import type {
    ClientConfiguration,
    CreateBucketRequest,
    GetObjectOutput,
    GetObjectRequest,
    HeadBucketRequest,
    HeadObjectRequest,
    PutObjectRequest,
} from 'aws-sdk/clients/s3';
import assert from 'assert';
import * as fs from 'fs';

export default class S3Client {
    private static client: S3 | undefined;

    public static getClient(): S3 {
        if (S3Client.client) {
            return S3Client.client;
        }

        S3Client.client = new S3(S3Client.getOptions());
        return S3Client.client;
    }

    private static getOptions(): ClientConfiguration {
        if (process.env.AWS_LOCAL_ENDPOINT) {
            return {
                s3ForcePathStyle: true,
                endpoint: process.env.AWS_LOCAL_ENDPOINT,
            };
        }
        return {};
    }

    public static async bucketExists(bucket: string): Promise<boolean> {
        try {
            const params: HeadBucketRequest = {
                Bucket: bucket,
            };
            await S3Client.getClient().headBucket(params).promise();
            return true;
        } catch (error) {
            return false;
        }
    }

    public static async createBucket(bucket: string): Promise<void> {
        const params: CreateBucketRequest = {
            Bucket: bucket,
        };
        await S3Client.getClient().createBucket(params).promise();
    }

    public static async writeFileToBucket(s3Url: string, filePath: string): Promise<void> {
        const content: string = fs.readFileSync(filePath).toString();
        await S3Client.writeToBucket(s3Url, content);
    }

    public static async writeToBucket(s3Url: string, content: string): Promise<void> {
        try {
            const url = this.toS3Url(s3Url);
            const params: PutObjectRequest = {
                Bucket: url.hostname,
                Key: url.pathname,
                Body: content,
            };
            await S3Client.getClient().putObject(params).promise();
        } catch (error) {
            throw new Error('Invalid s3 url');
        }
    }

    public static async fileExists(s3Url: string): Promise<boolean> {
        try {
            const url = this.toS3Url(s3Url);
            const params: HeadObjectRequest = {
                Bucket: url.hostname,
                Key: url.pathname,
            };
            await S3Client.getClient().headObject(params).promise();
            return true;
        } catch (error) {
            return false;
        }
    }

    public static async readFromBucket(s3Url: string): Promise<string> {
        try {
            const url = this.toS3Url(s3Url);
            const params: GetObjectRequest = {
                Bucket: url.hostname,
                Key: url.pathname,
            };
            const response: GetObjectOutput = await S3Client.getClient().getObject(params).promise();

            return !response.Body ? '' : response.Body.toString('utf-8');
        } catch (error) {
            throw new Error('Invalid s3 url');
        }
    }

    private static toS3Url(s3Url: string): URL {
        const url: URL = new URL(s3Url);
        assert(url.protocol === 's3:');
        return url;
    }
}
