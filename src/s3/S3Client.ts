import type { GetObjectCommandOutput, S3ClientConfig } from '@aws-sdk/client-s3';
import {
    S3,
    CreateBucketCommand,
    GetObjectCommand,
    HeadBucketCommand,
    HeadObjectCommand,
    PutObjectCommand,
} from '@aws-sdk/client-s3';
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

    private static getOptions(): S3ClientConfig {
        if (process.env.LOCALSTACK_HOSTNAME && process.env.EDGE_PORT) {
            const endpoint = `${process.env.LOCALSTACK_HOSTNAME}:${process.env.EDGE_PORT}`;
            return {
                endpoint,
                forcePathStyle: true,
            };
        }
        return {};
    }

    public static async bucketExists(bucket: string): Promise<boolean> {
        try {
            const command: HeadBucketCommand = new HeadBucketCommand({
                Bucket: bucket,
            });
            await S3Client.getClient().send(command);
            return true;
        } catch (error) {
            return false;
        }
    }

    public static async createBucket(bucket: string): Promise<void> {
        const command: CreateBucketCommand = new CreateBucketCommand({
            Bucket: bucket,
        });
        await S3Client.getClient().send(command);
    }

    public static async writeFileToBucket(s3Url: string, filePath: string): Promise<void> {
        const content: string = fs.readFileSync(filePath).toString();
        await S3Client.writeToBucket(s3Url, content);
    }

    public static async writeToBucket(s3Url: string, content: string): Promise<void> {
        try {
            const url = this.toS3Url(s3Url);
            const command: PutObjectCommand = new PutObjectCommand({
                Bucket: url.hostname,
                Key: url.pathname,
                Body: content,
            });
            await S3Client.getClient().send(command);
        } catch (error) {
            throw new Error('Invalid s3 url');
        }
    }

    public static async fileExists(s3Url: string): Promise<boolean> {
        try {
            const url = this.toS3Url(s3Url);
            const command: HeadObjectCommand = new HeadObjectCommand({
                Bucket: url.hostname,
                Key: url.pathname,
            });
            await S3Client.getClient().send(command);
            return true;
        } catch (error) {
            return false;
        }
    }

    public static async readFromBucket(s3Url: string): Promise<string> {
        try {
            const url = this.toS3Url(s3Url);
            const command: GetObjectCommand = new GetObjectCommand({
                Bucket: url.hostname,
                Key: url.pathname,
            });
            const response: GetObjectCommandOutput = await S3Client.getClient().send(command);

            return !response.Body ? '' : response.Body.transformToString('utf-8');
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
