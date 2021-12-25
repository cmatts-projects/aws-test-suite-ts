import LocalStackContainer from '../jestcontainers/LocalStackContainer';
import LocalStackService from '../jestcontainers/LocalStackService';
import DynamoRepository from '@/dynamo/DynamoRepository';
import CloudFormationClient from '@/cloudformation/CloudFormationClient';
import fs from 'fs';
import DynamoTestDataFactory from './DynamoTestDataFactory';
import type Person from '@/dynamo/model/Person';
import type Fact from '@/dynamo/model/Fact';
import type Siblings from '@/dynamo/model/Siblings';

describe('dynamo repository client test', () => {
    const DYNAMO_TABLES_YML = './cloudformation/dynamo-tables.yml';

    let localStackContainer: LocalStackContainer | undefined;

    const testPeople = DynamoTestDataFactory.peopleDataList();
    const testFacts = DynamoTestDataFactory.factDataList();

    beforeAll(async () => {
        localStackContainer = await LocalStackContainer.create([
            LocalStackService.DYNAMO_DB,
            LocalStackService.CLOUD_FORMATION,
        ]);
        localStackContainer.setLocalstackProperties();

        const content = fs.readFileSync(DYNAMO_TABLES_YML).toString();
        await CloudFormationClient.createStack('DynamoDB', content);

        await DynamoRepository.load(testPeople);
        await DynamoRepository.load(testFacts);
    });

    afterAll(async () => {
        if (localStackContainer) {
            await localStackContainer.destroy();
        }
    });

    it('should find person', async () => {
        const p: Person | undefined = await DynamoRepository.findPerson(1);
        expect(p).toBeDefined();
        expect(p).toStrictEqual(testPeople[0]);
    });

    it('should not find person', async () => {
        const result: Person | undefined = await DynamoRepository.findPerson(99);
        expect(result).toBeUndefined();
    });

    it('should not find undefined person', async () => {
        const result: Person | undefined = await DynamoRepository.findPerson(undefined);
        expect(result).toBeUndefined();
    });

    it('should find facts for person', async () => {
        const expectedFacts: Fact[] = [testFacts[0], testFacts[1], testFacts[2]];

        const facts: Fact[] = await DynamoRepository.findFacts(1);
        expect(facts).toHaveLength(3);
        expect(facts).toEqual(expect.arrayContaining(expectedFacts));
    });

    it('should not find facts', async () => {
        const facts: Fact[] = await DynamoRepository.findFacts(99);
        expect(facts).toHaveLength(0);
    });

    it('should not find undefined facts', async () => {
        const facts: Fact[] = await DynamoRepository.findFacts(undefined);
        expect(facts).toHaveLength(0);
    });

    it('should find all siblings grouped by parents and in order of year of birth', async () => {
        const siblings: Siblings = await DynamoRepository.findSiblings(1);
        expect(siblings).toStrictEqual(DynamoTestDataFactory.siblings(1));
    });

    it('should find siblings with no mother assuming the same mother', async () => {
        const siblings: Siblings = await DynamoRepository.findSiblings(3);

        expect(siblings).toStrictEqual(DynamoTestDataFactory.siblings(3));
    });

    it('should find siblings with no father assuming the same father', async () => {
        const siblings: Siblings = await DynamoRepository.findSiblings(8);

        expect(siblings).toStrictEqual(DynamoTestDataFactory.siblings(8));
    });

    it('should not find siblings', async () => {
        const siblings: Siblings = await DynamoRepository.findSiblings(99);

        expect(siblings.fullSiblings).toHaveLength(0);
        expect(siblings.stepByFather).toHaveLength(0);
        expect(siblings.stepByMother).toHaveLength(0);
        expect(siblings.parents).toHaveLength(0);
    });

    it('should find all people sorted', async () => {
        const people: Person[] = await DynamoRepository.findPeople();
        expect(people).toHaveLength(testPeople.length);
        expect(people[0].name).toBe('First Person');
        expect(people[1].name).toBe('Mr Test');
    });

    it('should update entities', async () => {
        const person: Person = (await DynamoRepository.findPerson(21))!;
        person.yearOfBirth = 1799;
        person.yearOfDeath = 1888;

        const fact: Fact = (await DynamoRepository.findFacts(21))[0];
        fact.image = 'Updated';
        fact.description = 'A changed description';

        await DynamoRepository.updateEntities([person, fact]);

        const updatedPerson: Person = (await DynamoRepository.findPerson(21))!;
        const updatedFact: Fact = (await DynamoRepository.findFacts(21))[0];

        expect(updatedPerson).toStrictEqual(person);
        expect(updatedFact).toStrictEqual(fact);
    });
});
