import { Felt } from 'primitives/felt';

class SquashedDictManagerError extends Error {}

export class EmptyKeys extends SquashedDictManagerError {
  constructor() {
    super('There is no keys left in the squashed dictionnary.');
  }
}

export class EmptyIndices extends SquashedDictManagerError {
  constructor(key: Felt | undefined) {
    super(
      `There is no indices at key ${
        key ? key.toString() : key
      } in the squashed dictionnary.`
    );
  }
}

export class EmptyIndex extends SquashedDictManagerError {
  constructor() {
    super('The last index of the squashed dictionnary is empty.');
  }
}
