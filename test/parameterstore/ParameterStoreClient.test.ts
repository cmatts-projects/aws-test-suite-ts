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

        localStackContainer.setLocalstackProperties();
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
