import {
  EmptyVariableName,
  UnknownHint,
  UnreachableReference,
} from 'errors/hint';

import { Hint, ReferenceManager } from 'vm/program';
import { VirtualMachine } from 'vm/virtualMachine';
import { HintReference } from './hintReference';
import { IdsManager } from './idsManager';
import { ScopeManager } from './scopeManager';
import * as hintCode from './hintCode';
import { addECDSASignature } from './signature/ecdsa';

export type HintData = {
  ids: IdsManager;
  code: string;
};

export class HintProcessor {
  public scopeManager: ScopeManager;

  constructor() {
    this.scopeManager = new ScopeManager();
  }

  /** Compile an hint from the compilation artifact
   * to a format that can be easily executed.
   *
   * @param hint The hint to be compiled, from the compilation
   * @param refManager All the program references
   */
  static compile(hint: Hint, refManager: ReferenceManager): HintData {
    const references = new Map<string, HintReference>(
      Object.entries(hint.flow_tracking_data.reference_ids).map(
        ([fullName, index]) => {
          const reference = refManager.references[index];
          if (!reference) throw new UnreachableReference(index);
          const name = fullName.split('.').pop();
          if (!name) throw new EmptyVariableName();
          return [name, HintReference.parseReference(reference)];
        }
      )
    );
    return {
      ids: new IdsManager(references, hint.flow_tracking_data.ap_tracking),
      code: hint.code,
    };
  }

  /**
   * Execute an hint based on its code
   * `hint.code` allows mapping the Python hint code
   * to its associated function in TypeScript
   *
   * `hint.ids` and `vm` provide the context
   * on which the hint must be executed.
   *
   * The virtual machine stores the constants
   * used by the program.
   *
   */
  execute(hint: HintData, vm: VirtualMachine) {
    switch (hint.code) {
      case hintCode.ADD_ECDSA_SIGNATURE:
        addECDSASignature(hint.ids, vm);
        break;
      default:
        throw new UnknownHint(hint.code);
    }
  }
}
