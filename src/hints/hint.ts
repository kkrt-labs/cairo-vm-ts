import { UnknownHint } from 'errors/hint';

import { Hint } from 'vm/program';

export class HintProcessor {
  compile(_hint: Hint) {}

  execute(hint: Hint) {
    switch (hint.code) {
      default:
        throw new UnknownHint(hint.code);
    }
  }
}
