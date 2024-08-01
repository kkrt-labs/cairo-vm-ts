import { Relocatable } from 'primitives/relocatable';

class DictionaryError extends Error {}

/** Cannot find Dictionary at `address` */
export class DictNotFound extends DictionaryError {
  constructor(address: Relocatable) {
    super(`Cannot found any Dictionary at address ${address.toString()}`);
  }
}
