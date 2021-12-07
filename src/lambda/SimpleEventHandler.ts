import MyEvent from '@/lambda/model/MyEvent';

export default class SimpleEventHandler {
    public static async handleRequest(event: MyEvent): Promise<string> {
        return event.message;
    }
}
