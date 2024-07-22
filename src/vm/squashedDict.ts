import { EmptyIndex, EmptyIndices, EmptyKeys } from 'errors/squashedDict';
import { Felt } from 'primitives/felt';

export class SquashedDictManager {
  public keyToIndices: Map<string, Felt[]>;
  public keys: Felt[];

  constructor() {
    this.keyToIndices = new Map<string, Felt[]>();
    this.keys = [];
  }

  insert(key: Felt, index: Felt) {
    const keyStr = key.toString();
    const indices = this.keyToIndices.get(keyStr);
    if (!indices) {
      this.keyToIndices.set(keyStr, [index]);
    } else {
      indices.push(index);
    }
  }

  lastKey(): Felt {
    const len = this.keys.length;
    if (!len) throw new EmptyKeys();
    return this.keys[len - 1];
  }

  popKey(): Felt {
    const key = this.keys.pop();
    if (!key) throw new EmptyKeys();
    return key;
  }

  lastIndices(): Felt[] {
    const key = this.lastKey();
    const indices = this.keyToIndices.get(key.toString());
    if (!indices) throw new EmptyIndices(key);
    return indices;
  }

  lastIndex(): Felt {
    const indices = this.lastIndices();
    const len = indices.length;
    if (!len) throw new EmptyIndex();
    return indices[len - 1];
  }

  popIndex(): Felt {
    const index = this.lastIndices().pop();
    if (!index) throw new EmptyIndex();
    return index;
  }
}
