import {
  EmptyIndex,
  EmptyIndices,
  EmptyKeys,
} from 'errors/squashedDictManager';

import { Felt } from 'primitives/felt';

/**
 *  Handle the squashing of dictionnaries.
 */
export class SquashedDictManager {
  /** Maps the key of a dictionnary to its taken values accross the run. */
  public keyToIndices: Map<string, Felt[]>;
  /** An array containing the keys that still needs to be squashed. */
  public keys: Felt[];

  constructor() {
    this.keyToIndices = new Map<string, Felt[]>();
    this.keys = [];
  }

  /** Add `index` to the indices taken by `key` */
  insert(key: Felt, index: Felt) {
    const keyStr = key.toString();
    const indices = this.keyToIndices.get(keyStr);
    if (!indices) {
      this.keyToIndices.set(keyStr, [index]);
    } else {
      indices.push(index);
    }
  }

  /** Return the last key of the dictionnary. */
  lastKey(): Felt {
    const len = this.keys.length;
    if (!len) throw new EmptyKeys();
    return this.keys[len - 1];
  }

  /** Remove and return the last key of the dictionnary. */
  popKey(): Felt {
    const key = this.keys.pop();
    if (!key) throw new EmptyKeys();
    return key;
  }

  /** Return the array of indices taken by the last key. */
  lastIndices(): Felt[] {
    const key = this.lastKey();
    const indices = this.keyToIndices.get(key.toString());
    if (!indices) throw new EmptyIndices(key);
    return indices;
  }

  /** Return the last index of the indices taken by the last key. */
  lastIndex(): Felt {
    const indices = this.lastIndices();
    const len = indices.length;
    if (!len) throw new EmptyIndex();
    return indices[len - 1];
  }

  /** Remove and return the last index of the indices taken by the last key. */
  popIndex(): Felt {
    const index = this.lastIndices().pop();
    if (!index) throw new EmptyIndex();
    return index;
  }
}
