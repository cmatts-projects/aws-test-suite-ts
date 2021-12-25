export default interface Fact {
    id: number;
    personId: number;
    year: number;
    image: string | undefined;
    source: string | undefined;
    description: string;
    version: number;
}
