import {
  UndefinedVariable,
  UndefinedImmediateRef,
  InvalidValueType,
  ApTrackingDataGroupDifferHintRef,
  InvalidRegister,
  UndefinedValue,
} from 'errors/idsManager';
import { ExpectedRelocatable } from 'errors/primitives';
import { Felt } from 'primitives/felt';
import { Relocatable } from 'primitives/relocatable';
import { isRelocatable } from 'primitives/segmentValue';
import { Register } from 'vm/instruction';
import { ApTrackingData } from 'vm/program';
import { VirtualMachine } from 'vm/virtualMachine';
import { HintReference, ValueType, OffsetValue } from './hintReference';

export class IdsManager {
  constructor(
    public references: Map<string, HintReference>,
    public hintApTrackingData: ApTrackingData
  ) {
    this.references = references;
    this.hintApTrackingData = hintApTrackingData;
  }

  get(name: string, vm: VirtualMachine) {
    const reference = this.references.get(name);
    if (!reference) throw new UndefinedVariable(name);
    return IdsManager.getValueFromReference(
      reference,
      this.hintApTrackingData,
      vm
    );
  }

  static getValueFromReference(
    reference: HintReference,
    hintApTrackingData: ApTrackingData,
    vm: VirtualMachine
  ) {
    const offset1 = reference.offset1;
    switch (offset1.valueType) {
      case ValueType.Immediate:
        if (!offset1.immediate) throw new UndefinedImmediateRef(reference);
        return offset1.immediate;
      case ValueType.Reference:
        const address = IdsManager.getAddressFromReference(
          reference,
          hintApTrackingData,
          vm
        );
        if (!isRelocatable(address)) throw new ExpectedRelocatable(address);
        if (reference.dereferenced) {
          return vm.memory.get(address);
        }
        return address;
      default:
        throw new InvalidValueType(reference, offset1);
    }
  }

  static getAddressFromReference(
    reference: HintReference,
    hintApTrackingData: ApTrackingData,
    vm: VirtualMachine
  ) {
    const offset1 = reference.offset1;
    const offset1Value = IdsManager.getOffsetValueReference(
      offset1,
      hintApTrackingData,
      reference.apTrackingData,
      vm
    );
    if (!offset1Value) throw new UndefinedValue(offset1);

    let offsetValue = offset1Value;
    const offset2 = reference.offset2;
    if (offset2) {
      switch (offset2.valueType) {
        case ValueType.Value:
          if (offset2.value === undefined) throw new UndefinedValue(offset2);
          offsetValue = offset1Value.add(new Felt(BigInt(offset2.value)));
          break;
        case ValueType.Reference:
          const offset2Value = IdsManager.getOffsetValueReference(
            offset2,
            hintApTrackingData,
            reference.apTrackingData,
            vm
          );
          if (!offset2Value) throw new UndefinedValue(offset2);
          offsetValue = offset1Value.add(offset2Value);
          break;
        default:
          throw new InvalidValueType(reference, offset2);
      }
    }
    return offsetValue;
  }

  static getOffsetValueReference(
    offset: OffsetValue,
    hintApTrackingData: ApTrackingData,
    refApTrackingData: ApTrackingData,
    vm: VirtualMachine
  ) {
    let baseAddr: Relocatable;
    switch (offset.register) {
      case Register.Fp:
        baseAddr = vm.fp;
        break;
      case Register.Ap:
        if (refApTrackingData.group !== hintApTrackingData.group)
          throw new ApTrackingDataGroupDifferHintRef(
            hintApTrackingData.group,
            refApTrackingData.group
          );
        baseAddr = vm.ap.sub(
          hintApTrackingData.offset - refApTrackingData.offset
        );
        break;
      default:
        throw new InvalidRegister(offset, offset.register);
    }
    if (!baseAddr) throw new Error('');
    if (offset.value === undefined) throw new UndefinedValue(offset);
    const address = baseAddr.add(offset.value);
    if (offset.dereferenced) {
      return vm.memory.get(address);
    }
    return address;
  }
}
