import type Person from './model/Person';
import type Fact from './model/Fact';
import type Siblings from './model/Siblings';
import { DynamoDB } from 'aws-sdk';
import {
    BatchWriteItemInput,
    ClientConfiguration,
    Converter,
    ExpressionAttributeNameMap,
    ExpressionAttributeValueMap,
    QueryInput,
    QueryOutput,
    ScanInput,
    ScanOutput,
    TransactWriteItem,
    TransactWriteItemsInput,
    WriteRequest,
    WriteRequests,
} from 'aws-sdk/clients/dynamodb';

export default class DynamoRepository {
    private static readonly BATCH_SIZE: number = 25;
    private static client: DynamoDB | undefined;

    public static getClient(): DynamoDB {
        if (DynamoRepository.client) {
            return DynamoRepository.client;
        }

        DynamoRepository.client = new DynamoDB(DynamoRepository.getOptions());
        return DynamoRepository.client;
    }

    private static getOptions(): ClientConfiguration {
        if (process.env.LOCALSTACK_HOSTNAME && process.env.EDGE_PORT) {
            const endpoint = `${process.env.LOCALSTACK_HOSTNAME}:${process.env.EDGE_PORT}`;
            return {
                endpoint,
                region: process.env.AWS_REGION,
            };
        }
        return {};
    }

    public static async load(dataList: Person[] | Fact[]): Promise<void> {
        for (let i = 0; i < dataList.length; i += DynamoRepository.BATCH_SIZE) {
            const batch: WriteRequests = await Promise.all(
                dataList.slice(i, i + DynamoRepository.BATCH_SIZE).map((data) => DynamoRepository.putRequest(data)),
            );

            const params: BatchWriteItemInput = {
                RequestItems: {},
            };
            params.RequestItems[DynamoRepository.tableName(dataList[0])] = batch;
            await DynamoRepository.getClient().batchWriteItem(params).promise();
        }
    }

    public static async findPerson(id: number | undefined): Promise<Person | undefined> {
        if (!id) {
            return undefined;
        }

        const params: QueryInput = {
            TableName: 'dynamo.example.people',
            ConsistentRead: true,
            KeyConditionExpression: 'id = :id',
            ExpressionAttributeValues: {
                ':id': {
                    N: `${id}`,
                },
            },
        };
        const result: QueryOutput = await DynamoRepository.getClient().query(params).promise();
        const people: Person[] | undefined = result.Items?.map((item) => Converter.unmarshall(item) as Person);
        return !people || people.length == 0 ? undefined : people[0];
    }

    public static async findPeople(): Promise<Person[]> {
        const params: ScanInput = {
            TableName: 'dynamo.example.people',
        };
        const result: ScanOutput = await DynamoRepository.getClient().scan(params).promise();
        const people: Person[] | undefined = result.Items?.map((item) => Converter.unmarshall(item) as Person);
        return !people ? [] : people.sort(DynamoRepository.nameComparator);
    }

    public static async findFacts(personId: number | undefined): Promise<Fact[]> {
        if (!personId) {
            return [];
        }

        const params: QueryInput = {
            TableName: 'dynamo.example.facts',
            ConsistentRead: false,
            IndexName: 'personIndex',
            KeyConditionExpression: 'personId = :id',
            ExpressionAttributeValues: {
                ':id': {
                    N: `${personId}`,
                },
            },
        };
        const result: QueryOutput = await DynamoRepository.getClient().query(params).promise();
        const facts: Fact[] | undefined = result.Items?.map((item) => Converter.unmarshall(item) as Fact);
        return !facts ? [] : facts;
    }

    public static async findSiblings(id: number): Promise<Siblings> {
        let fullSiblings: Person[] = [];
        let stepByFather: Person[] = [];
        let stepByMother: Person[] = [];
        let parents: Person[] = [];

        const person: Person | undefined = await DynamoRepository.findPerson(id);
        if (person) {
            const allSiblings: Person[] = await DynamoRepository.findAllSiblings(person);
            fullSiblings = DynamoRepository.extractFullSiblings(person, allSiblings);
            stepByFather = DynamoRepository.extractStepSiblingsByFather(person, allSiblings);
            stepByMother = DynamoRepository.extractStepSiblingsByMother(person, allSiblings);
            parents = await DynamoRepository.extractParents(allSiblings);
        }

        return {
            fullSiblings,
            stepByFather,
            stepByMother,
            parents,
        };
    }

    public static async findPersonByFather(id: number | undefined): Promise<Person[]> {
        if (!id) {
            return [];
        }

        const params: QueryInput = {
            TableName: 'dynamo.example.people',
            IndexName: 'fatherIndex',
            ConsistentRead: false,
            KeyConditionExpression: 'fatherId = :id',
            ExpressionAttributeValues: {
                ':id': {
                    N: `${id}`,
                },
            },
        };

        const result: QueryOutput = await DynamoRepository.getClient().query(params).promise();
        const people: Person[] | undefined = result.Items?.map((item) => Converter.unmarshall(item) as Person);
        return !people || people.length == 0 ? [] : people;
    }

    public static async findPersonByMother(id: number | undefined): Promise<Person[]> {
        if (!id) {
            return [];
        }
        const params: QueryInput = {
            TableName: 'dynamo.example.people',
            IndexName: 'motherIndex',
            ConsistentRead: false,
            KeyConditionExpression: 'motherId = :id',
            ExpressionAttributeValues: {
                ':id': {
                    N: `${id}`,
                },
            },
        };

        const result: QueryOutput = await DynamoRepository.getClient().query(params).promise();
        const people: Person[] | undefined = result.Items?.map((item) => Converter.unmarshall(item) as Person);
        return !people || people.length == 0 ? [] : people;
    }

    public static async updateEntities(entities: (Person | Fact)[]): Promise<void> {
        const params: TransactWriteItemsInput = {
            TransactItems: [],
        };
        for (let i = 0; i < entities.length; i++) {
            const item: TransactWriteItem = DynamoRepository.updateStatement(entities[i]);
            params.TransactItems.push(item);
        }
        await DynamoRepository.getClient().transactWriteItems(params).promise();
    }

    private static async findAllSiblings(person: Person): Promise<Person[]> {
        const allSiblings: Person[] = [];

        const byFather = await DynamoRepository.findPersonByFather(person.fatherId);
        byFather.forEach((p) => {
            if (allSiblings.filter((s) => s.id === p.id).length == 0) {
                allSiblings.push(p);
            }
        });

        const byMother = await DynamoRepository.findPersonByMother(person.motherId);
        byMother.forEach((p) => {
            if (allSiblings.filter((s) => s.id === p.id).length == 0) {
                allSiblings.push(p);
            }
        });
        return allSiblings;
    }

    private static async extractParents(allSiblings: Person[]): Promise<Person[]> {
        const parentIds: Set<number | undefined> = new Set([
            ...allSiblings.map((s) => s.fatherId),
            ...allSiblings.map((s) => s.motherId),
        ]);
        const parents: Person[] = [];

        for (const i of parentIds) {
            const p = await DynamoRepository.findPerson(i);
            if (p) {
                parents.push(p);
            }
        }

        return parents.sort((a: Person, b: Person) => a.id - b.id);
    }

    private static putRequest(e: Person | Fact): WriteRequest {
        return {
            PutRequest: {
                Item: Converter.marshall(e),
            },
        };
    }

    private static updateStatement(e: Person | Fact): TransactWriteItem {
        let updateAttrs = '';
        const expressionAttrs: ExpressionAttributeValueMap = {};
        const expressionNames: ExpressionAttributeNameMap = {};
        Object.keys(e).forEach((key) => {
            if (key != 'id') {
                updateAttrs += updateAttrs.length == 0 ? 'SET ' : ', ';

                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                const val = e[key];
                const attr = `:${key}`;
                const attrName = `#${key}`;
                const attrType: string = !val ? 'NULL' : typeof val === 'string' ? 'S' : 'N';

                expressionAttrs[attr] = {};
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                expressionAttrs[attr][`${attrType}`] = `${val}`;
                updateAttrs += `${attrName}=${attr}`;
                expressionNames[attrName] = key;
            }
        });

        return {
            Update: {
                TableName: DynamoRepository.tableName(e),
                Key: {
                    id: {
                        N: `${e.id}`,
                    },
                },
                UpdateExpression: updateAttrs,
                ExpressionAttributeValues: expressionAttrs,
                ExpressionAttributeNames: expressionNames,
            },
        };
    }

    private static tableName(e: Person | Fact): string {
        return `dynamo.example.${(e as Person).name ? 'people' : 'facts'}`;
    }

    private static nameComparator(a: Person, b: Person): number {
        return a.name < b.name ? -1 : a.name == b.name ? 0 : 1;
    }

    private static extractStepSiblingsByMother(person: Person, allSiblings: Person[]): Person[] {
        return allSiblings
            .filter((s) => s.fatherId != person.fatherId && s.motherId == person.motherId)
            .sort((a, b) => DynamoRepository.parentYearComparator(a, b, a.fatherId, b.fatherId));
    }

    private static extractStepSiblingsByFather(person: Person, allSiblings: Person[]): Person[] {
        return allSiblings
            .filter((s) => s.fatherId == person.fatherId && s.motherId != person.motherId)
            .sort((a, b) => DynamoRepository.parentYearComparator(a, b, a.motherId, b.motherId));
    }

    private static extractFullSiblings(person: Person, allSiblings: Person[]): Person[] {
        return allSiblings
            .filter((s) => s.fatherId == person.fatherId && s.motherId == person.motherId)
            .sort(DynamoRepository.yearComparator);
    }

    private static yearComparator(a: Person, b: Person): number {
        return a.yearOfBirth &&
            b.yearOfBirth &&
            (a.yearOfBirth > b.yearOfBirth || (a.yearOfBirth == b.yearOfBirth && a.id > b.id))
            ? 1
            : -1;
    }

    private static parentYearComparator(
        a: Person,
        b: Person,
        aParentId: number | undefined,
        bParentId: number | undefined,
    ): number {
        return (aParentId == bParentId &&
            (!b.yearOfBirth ||
                (a.yearOfBirth &&
                    (a.yearOfBirth > b.yearOfBirth || (a.yearOfBirth == b.yearOfBirth && a.id > b.id))))) ||
            (aParentId != bParentId && ((aParentId && !bParentId) || (aParentId && bParentId && aParentId > bParentId)))
            ? 1
            : -1;
    }
}
