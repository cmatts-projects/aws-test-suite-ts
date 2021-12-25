import Person from './Person';

export default interface Siblings {
    fullSiblings: Person[];
    stepByFather: Person[];
    stepByMother: Person[];
    parents: Person[];
}
