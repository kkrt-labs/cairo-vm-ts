import { UnknownHint, UnreachableReference } from 'errors/hint';

import { Hint, ReferenceManager } from 'vm/program';
import { HintReference } from './hintReference';
import { IdsManager } from './idsManager';
import { ScopeManager } from './scopeManager';

export type HintData = {
  ids: IdsManager;
  code: string;
};

export class HintProcessor {
  public scopeManager: ScopeManager;

  constructor() {
    this.scopeManager = new ScopeManager();
  }

  compile(hint: Hint, refManager: ReferenceManager): HintData {
    const references = new Map<string, HintReference>();
    Object.entries(hint.flow_tracking_data.reference_ids).map(
      ([name, index]) => {
        const refManagerLen = refManager.references.length;
        if (index >= refManagerLen)
          throw new UnreachableReference(index, refManagerLen);
        const splitName = name.split('.');
        references.set(
          splitName[splitName.length - 1],
          HintReference.parseReference(refManager.references[index])
        );
      }
    );
    return {
      ids: new IdsManager(references, hint.flow_tracking_data.ap_tracking),
      code: hint.code,
    };
  }

  execute(hint: Hint) {
    switch (hint.code) {
      default:
        throw new UnknownHint(hint.code);
    }
  }
}
