import LocalStackContainer from '../jestcontainers/LocalStackContainer';
import LocalStackService from '../jestcontainers/LocalStackService';
import SecretsManagerClient from '@/secretsmanager/SecretsManagerClient';

describe('secrets manager client test', () => {
    const SECRET_NAME = 'MY_SECRET';
    const UPDATED_SECRET_NAME = 'UPDATE_MY_SECRET';
    const SECRET_VALUE = '{ "mySecret": "mySecretValue" }';

    let localStackContainer: LocalStackContainer | undefined;

    beforeAll(async () => {
        localStackContainer = await LocalStackContainer.create([LocalStackService.SECRETS_MANAGER]);

        localStackContainer.setLocalstackProperties();
    });

    afterAll(async () => {
        if (localStackContainer) {
            await localStackContainer.destroy();
        }
    });

    it('should access secret', async () => {
        await SecretsManagerClient.createSecret(SECRET_NAME, SECRET_VALUE);
        expect(await SecretsManagerClient.readSecret(SECRET_NAME)).toBe(SECRET_VALUE);
    });

    it('should update secret', async () => {
        await SecretsManagerClient.createSecret(UPDATED_SECRET_NAME, SECRET_VALUE);
        const secret = '{ "mySecret": "mySecretValue", "myUpdateSecret": "myUpdatedSecretValue"}';
        await SecretsManagerClient.updateSecret(UPDATED_SECRET_NAME, secret);

        expect(await SecretsManagerClient.readSecret(UPDATED_SECRET_NAME)).toBe(secret);
    });
});
