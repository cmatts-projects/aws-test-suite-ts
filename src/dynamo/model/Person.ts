export default interface Person {
    id: number;
    name: string;
    yearOfBirth: number | undefined;
    yearOfDeath: number | undefined;
    fatherId: number | undefined;
    motherId: number | undefined;
    version: number;
}
