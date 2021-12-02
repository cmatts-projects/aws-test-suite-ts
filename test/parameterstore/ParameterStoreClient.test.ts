import LocalStackContainer from '../jestcontainers/LocalStackContainer';
import LocalStackService from '../jestcontainers/LocalStackService';
import ParameterStoreClient from '@/parameterstore/ParameterStoreClient';

describe('parameter store client test', () => {
    const PARAMETER_NAME = 'MY_PARAMETER';
    const PARAMETER_VALUE = 'A parameter value';
    const PARAMETER_DESCRIPTION = 'A description';

    let localStackContainer: LocalStackContainer | undefined;

    beforeAll(async () => {
        localStackContainer = await LocalStackContainer.create([LocalStackService.PARAMETER_STORE]);

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

    it('should access parameter', async () => {
        await ParameterStoreClient.writeParameter(PARAMETER_NAME, PARAMETER_VALUE, PARAMETER_DESCRIPTION);
        expect(await ParameterStoreClient.readParameter(PARAMETER_NAME)).toBe(PARAMETER_VALUE);
    });

    it('should not find parameter', async () => {
        expect(await ParameterStoreClient.readParameter('notaparameter')).toBeUndefined();
    });
});
