import { Felt } from 'primitives/felt';

class SquashedDictManagerError extends Error {}

/** There are no keys left in the squashed dictionary manager */
export class EmptyKeys extends SquashedDictManagerError {
  constructor() {
    super('There are no keys left in the squashed dictionary manager.');
  }
}

/** There are no indices at `key` */
export class EmptyIndices extends SquashedDictManagerError {
  constructor(key: Felt | undefined) {
    super(
      `There are no indices at key ${
        key ? key.toString() : key
      } in the squashed dictionary manager.`
    );
  }
}

/** The last index of the squashed dictionary manager is empty. */
export class EmptyIndex extends SquashedDictManagerError {
  constructor() {
    super('The last index of the squashed dictionary manager is empty.');
  }
}
