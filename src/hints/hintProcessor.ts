import { ExpectedFelt, ExpectedRelocatable } from 'errors/primitives';
import { InvalidCellRefRegister, UnknownHint } from 'errors/hints';
import { Felt } from 'primitives/felt';
import { Relocatable } from 'primitives/relocatable';
import { isFelt, isRelocatable } from 'primitives/segmentValue';
import { Register } from 'vm/instruction';
import { VirtualMachine } from 'vm/virtualMachine';
import {
  AllocSegment,
  BinOp,
  CellRef,
  Deref,
  DoubleDeref,
  Hint,
  HintName,
  Immediate,
  OpType,
  Operation,
  ResOp,
  TestLessThan,
} from './hintSchema';

export class HintProcessor {
  private static handlers: Record<
    HintName,
    (vm: VirtualMachine, hint: Hint) => void
  > = {
    [HintName.AllocSegment]: (vm, hint) => {
      const h = hint as AllocSegment;
      HintProcessor.allocSegment(vm, h.dst);
    },
    [HintName.TestLessThan]: (vm: VirtualMachine, hint: Hint) => {
      const h = hint as TestLessThan;
      HintProcessor.testLessThan(vm, h.lhs, h.rhs, h.dst);
    },
  };

  static execute(vm: VirtualMachine, hint: Hint) {
    const handler = HintProcessor.handlers[hint.type];
    if (!handler) throw new UnknownHint(hint);
    handler(vm, hint);
  }

  static allocSegment(vm: VirtualMachine, dst: CellRef) {
    const segmentId = vm.memory.addSegment();
    vm.memory.assertEq(HintProcessor.cellRefToRelocatable(vm, dst), segmentId);
  }

  static testLessThan(
    vm: VirtualMachine,
    lhs: ResOp,
    rhs: ResOp,
    dst: CellRef
  ) {
    const lhsValue = HintProcessor.getResOperandValue(vm, lhs);
    const rhsValue = HintProcessor.getResOperandValue(vm, rhs);
    const result = new Felt(BigInt(lhsValue < rhsValue));
    vm.memory.assertEq(HintProcessor.cellRefToRelocatable(vm, dst), result);
  }

  static cellRefToRelocatable(vm: VirtualMachine, cell: CellRef) {
    let register: Relocatable;
    switch (cell.register) {
      case Register.Ap:
        register = vm.ap;
        break;
      case Register.Fp:
        register = vm.fp;
        break;
      case Register.Pc:
        throw new InvalidCellRefRegister(cell);
    }
    return register.add(cell.offset);
  }

  static getPointer(vm: VirtualMachine, cell: CellRef, offset: Felt) {
    const address = vm.memory.get(
      HintProcessor.cellRefToRelocatable(vm, cell).add(offset)
    );
    if (!address || !isRelocatable(address))
      throw new ExpectedRelocatable(address);
    return address;
  }

  static getFelt(vm: VirtualMachine, cell: CellRef): Felt {
    const value = vm.memory.get(HintProcessor.cellRefToRelocatable(vm, cell));
    if (!value || !isFelt(value)) throw new ExpectedFelt(value);
    return value;
  }

  static getRelocatable(vm: VirtualMachine, cell: CellRef): Relocatable {
    const value = vm.memory.get(HintProcessor.cellRefToRelocatable(vm, cell));
    if (!value || !isRelocatable(value)) throw new ExpectedRelocatable(value);
    return value;
  }

  static getResOperandValue(vm: VirtualMachine, resOp: ResOp): Felt {
    switch (resOp.type) {
      case OpType.Deref:
        return HintProcessor.getFelt(vm, (resOp as Deref).cell);

      case OpType.DoubleDeref:
        const dDeref = resOp as DoubleDeref;
        const deref = HintProcessor.getRelocatable(vm, dDeref.cell);
        const value = vm.memory.get(deref.add(dDeref.offset));
        if (!value || !isFelt(value)) throw new ExpectedFelt(value);
        return value;

      case OpType.Immediate:
        return (resOp as Immediate).value;

      case OpType.BinOp:
        const binOp = resOp as BinOp;
        const a = HintProcessor.getFelt(vm, binOp.a);

        let b: Felt | undefined = undefined;
        switch (binOp.b.type) {
          case OpType.Deref:
            b = HintProcessor.getFelt(vm, (binOp.b as Deref).cell);
            break;

          case OpType.Immediate:
            b = (binOp.b as Immediate).value;
            break;

          default:
            throw new ExpectedFelt(b);
        }

        switch (binOp.op) {
          case Operation.Add:
            return a.add(b);

          case Operation.Mul:
            return a.mul(b);
        }
    }
  }
}
