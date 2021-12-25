import type Fact from '@/dynamo/model/Fact';
import type Person from '@/dynamo/model/Person';
import type Siblings from '@/dynamo/model/Siblings';
import * as data from './data.json';

export default class DynamoTestDataFactory {
    public static siblings(id: number): Siblings {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return data.siblings[`person_${id}`];
    }

    public static peopleDataList(): Person[] {
        return <Person[]>data.people;
    }

    public static factDataList(): Fact[] {
        return <Fact[]>data.facts;
    }
}
