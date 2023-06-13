import type Person from './model/Person';
import type Fact from './model/Fact';
import type Siblings from './model/Siblings';
import type {
    AttributeValue,
    BatchWriteItemCommandInput,
    DynamoDBClientConfig,
    QueryCommandOutput,
    ScanCommandOutput,
    TransactWriteItem,
    TransactWriteItemsCommandInput,
    WriteRequest,
} from '@aws-sdk/client-dynamodb';

import {
    DynamoDB,
    BatchWriteItemCommand,
    QueryCommand,
    ScanCommand,
    TransactWriteItemsCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

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

    private static getOptions(): DynamoDBClientConfig {
        if (process.env.LOCALSTACK_HOSTNAME && process.env.EDGE_PORT) {
            const endpoint = `http://${process.env.LOCALSTACK_HOSTNAME}:${process.env.EDGE_PORT}`;
            return {
                endpoint,
                region: process.env.AWS_REGION,
            };
        }
        return {};
    }

    public static async load(dataList: Person[] | Fact[]): Promise<void> {
        for (let i = 0; i < dataList.length; i += DynamoRepository.BATCH_SIZE) {
            const batch: Array<WriteRequest> = await Promise.all(
                dataList.slice(i, i + DynamoRepository.BATCH_SIZE).map((data) => DynamoRepository.putRequest(data)),
            );
            const records: Record<string, WriteRequest[]> = {
                [`${DynamoRepository.tableName(dataList[0])}`]: batch,
            };
            const writeRequest: BatchWriteItemCommandInput = {
                RequestItems: records,
            };

            const command: BatchWriteItemCommand = new BatchWriteItemCommand(writeRequest);
            await DynamoRepository.getClient().send(command);
        }
    }

    public static async findPerson(id: number | undefined): Promise<Person | undefined> {
        if (!id) {
            return undefined;
        }

        const command: QueryCommand = new QueryCommand({
            TableName: 'dynamo.example.people',
            ConsistentRead: true,
            KeyConditionExpression: 'id = :id',
            ExpressionAttributeValues: {
                ':id': {
                    N: `${id}`,
                },
            },
        });
        const result: QueryCommandOutput = await DynamoRepository.getClient().send(command);
        const people: Person[] | undefined = result.Items?.map((item) => unmarshall(item) as Person);
        return !people || people.length == 0 ? undefined : people[0];
    }

    public static async findPeople(): Promise<Person[]> {
        const command: ScanCommand = new ScanCommand({
            TableName: 'dynamo.example.people',
        });
        const result: ScanCommandOutput = await DynamoRepository.getClient().send(command);
        const people: Person[] | undefined = result.Items?.map((item) => unmarshall(item) as Person);
        return !people ? [] : people.sort(DynamoRepository.nameComparator);
    }

    public static async findFacts(personId: number | undefined): Promise<Fact[]> {
        if (!personId) {
            return [];
        }

        const command: QueryCommand = new QueryCommand({
            TableName: 'dynamo.example.facts',
            ConsistentRead: false,
            IndexName: 'personIndex',
            KeyConditionExpression: 'personId = :id',
            ExpressionAttributeValues: {
                ':id': {
                    N: `${personId}`,
                },
            },
        });
        const result: QueryCommandOutput = await DynamoRepository.getClient().send(command);
        const facts: Fact[] | undefined = result.Items?.map((item) => unmarshall(item) as Fact);
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

        const command: QueryCommand = new QueryCommand({
            TableName: 'dynamo.example.people',
            IndexName: 'fatherIndex',
            ConsistentRead: false,
            KeyConditionExpression: 'fatherId = :id',
            ExpressionAttributeValues: {
                ':id': {
                    N: `${id}`,
                },
            },
        });

        const result: QueryCommandOutput = await DynamoRepository.getClient().send(command);
        const people: Person[] | undefined = result.Items?.map((item) => unmarshall(item) as Person);
        return !people || people.length == 0 ? [] : people;
    }

    public static async findPersonByMother(id: number | undefined): Promise<Person[]> {
        if (!id) {
            return [];
        }
        const command: QueryCommand = new QueryCommand({
            TableName: 'dynamo.example.people',
            IndexName: 'motherIndex',
            ConsistentRead: false,
            KeyConditionExpression: 'motherId = :id',
            ExpressionAttributeValues: {
                ':id': {
                    N: `${id}`,
                },
            },
        });

        const result: QueryCommandOutput = await DynamoRepository.getClient().send(command);
        const people: Person[] | undefined = result.Items?.map((item) => unmarshall(item) as Person);
        return !people || people.length == 0 ? [] : people;
    }

    public static async updateEntities(entities: (Person | Fact)[]): Promise<void> {
        const transactionWriteItems: TransactWriteItemsCommandInput = {
            TransactItems: entities.map((e) => DynamoRepository.updateStatement(e)),
        };
        const command: TransactWriteItemsCommand = new TransactWriteItemsCommand(transactionWriteItems);
        await DynamoRepository.getClient().send(command);
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
                Item: marshall(e),
            },
        };
    }

    private static updateStatement(e: Person | Fact): TransactWriteItem {
        let updateAttrs = '';
        const expressionAttrs: Record<string, AttributeValue> = {};
        const expressionNames: Record<string, string> = {};
        Object.keys(e).forEach((key) => {
            if (key != 'id') {
                updateAttrs += updateAttrs.length == 0 ? 'SET ' : ', ';

                const attr = `:${key}`;
                const attrName = `#${key}`;
                updateAttrs += `${attrName}=${attr}`;
                expressionNames[attrName] = key;

                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                const val = e[key];
                const attrType: string = !val ? 'NULL' : typeof val === 'string' ? 'S' : 'N';
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                expressionAttrs[attr] = {
                    [`${attrType}`]: `${val}`,
                };
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
