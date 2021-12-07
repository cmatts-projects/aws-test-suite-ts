import MyEvent from '@/lambda/model/MyEvent';
import SimpleEventHandler from '@/lambda/SimpleEventHandler';

describe('Simple Event Handler Test', () => {
    it('should Return Event Message', async () => {
        const event: MyEvent = {
            message: 'A simple lambda response',
        };
        expect(await SimpleEventHandler.handleRequest(event)).toBe('A simple lambda response');
    });
});
