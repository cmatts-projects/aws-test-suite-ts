import LocalStackContainer from '../jestcontainers/LocalStackContainer';
import LocalStackService from '../jestcontainers/LocalStackService';
import S3Client from '@/s3/S3Client';

describe('s3 client test', () => {
    const TEST_BUCKET = 'mybucket';
    const TEST_CONTENT = '{ "content": "some content" }';

    let localStackContainer: LocalStackContainer | undefined;

    beforeAll(async () => {
        localStackContainer = await LocalStackContainer.create([LocalStackService.S3]);

        localStackContainer.setLocalstackProperties();

        // create s3 bucket
        await S3Client.createBucket(TEST_BUCKET);
    });

    afterAll(async () => {
        if (localStackContainer) {
            await localStackContainer.destroy();
        }
    });

    it('should check bucket exist', async () => {
        const bucketExists: boolean = await S3Client.bucketExists(TEST_BUCKET);
        expect(bucketExists).toBeTruthy();
    });

    it('should check bucket does not Exist', async () => {
        const fileExists: boolean = await S3Client.fileExists('notafile');
        expect(fileExists).toBeFalsy();
    });

    it('should check bucket does not Exist', async () => {
        const bucketExists: boolean = await S3Client.bucketExists('notabucket');
        expect(bucketExists).toBeFalsy();
    });

    it('should write file to bucket', async () => {
        const s3Url = 's3://mybucket/test/resources/MyFile.txt';
        await S3Client.writeFileToBucket(s3Url, '.gitignore');

        const fileExists: boolean = await S3Client.fileExists(s3Url);
        expect(fileExists).toBeTruthy();
    });

    it('should write string to bucket', async () => {
        const s3Url = 's3://mybucket/test/resources/MyContent.txt';
        await S3Client.writeToBucket(s3Url, TEST_CONTENT);

        const fileExists: boolean = await S3Client.fileExists(s3Url);
        expect(fileExists).toBeTruthy();
    });

    it('should not write to invalid bucket', async () => {
        const s3Url = 'http://mybucket/test/resources/MyContent.txt';
        await expect(S3Client.writeToBucket(s3Url, TEST_CONTENT)).rejects.toThrow('Invalid s3 url');
    });

    it('should read from bucket', async () => {
        const s3Url = 's3://mybucket/test/resources/readFile.txt';
        await S3Client.writeToBucket(s3Url, TEST_CONTENT);

        const actualFileContent: string = await S3Client.readFromBucket(s3Url);
        expect(actualFileContent).toBe(TEST_CONTENT);
    });

    it('should not read from bucket', async () => {
        const s3Url = 's3://mybucket/notafile';
        await expect(S3Client.readFromBucket(s3Url)).rejects.toThrow('Invalid s3 url');
    });
});
