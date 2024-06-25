import { ExpectedFelt, ExpectedRelocatable } from 'errors/primitives';

import { isFelt, isRelocatable } from 'primitives/segmentValue';
import { VirtualMachine } from 'vm/virtualMachine';
import { EcdsaSegment } from 'builtins/ecdsa';
import { IdsManager } from 'hints/idsManager';

export function addECDSASignature(ids: IdsManager, vm: VirtualMachine) {
  const r = ids.get('signature_r', vm);
  const s = ids.get('signature_s', vm);
  const ecdsaPtr = ids.get('ecdsa_ptr', vm);
  if (!r || !isFelt(r)) throw new ExpectedFelt(r);
  if (!s || !isFelt(s)) throw new ExpectedFelt(s);
  if (!ecdsaPtr || !isRelocatable(ecdsaPtr))
    throw new ExpectedRelocatable(ecdsaPtr);

  const ecdsaBuiltin = vm.memory.segments[ecdsaPtr.segmentId] as EcdsaSegment;
  ecdsaBuiltin.signatures[ecdsaPtr.offset] = { r, s };
}
