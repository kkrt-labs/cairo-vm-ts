import { test, expect, describe } from 'bun:test';
import { Instruction, Opcode, ResLogic } from './instruction';
import { VirtualMachine } from './virtualMachine';
import { Relocatable } from 'primitives/relocatable';
import { Felt } from 'primitives/felt';

function getInstructionWithOpcodeAndResLogic(
  opcode: Opcode,
  resLogic: ResLogic
): Instruction {
  const instruction = Instruction.default();
  instruction.opcode = opcode;
  instruction.resLogic = resLogic;
  return instruction;
}

describe('VirtualMachine', () => {
  // Test cases reproduced from:
  // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/vm_test.go#L16
  describe('deduceOp0', () => {
    test('should deduce op0 return opcode', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.Ret,
        ResLogic.Add
      );
      const vm = new VirtualMachine();

      const { value: op0 } = vm.deduceOp0(instruction, undefined, undefined);
      expect(op0).toEqual([undefined, undefined]);
    });

    test('should deduce op0 for assert eq res logic mul', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.AssertEq,
        ResLogic.Mul
      );
      const vm = new VirtualMachine();
      const dst = new Felt(6n);
      const op1 = new Felt(3n);

      const { value: op0 } = vm.deduceOp0(instruction, dst, op1);
      expect(op0).toEqual([new Felt(2n), dst]);
    });

    test('should return undefined for assert eq res logic mul with op1 = 0', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.AssertEq,
        ResLogic.Mul
      );
      const vm = new VirtualMachine();
      const dst = new Felt(6n);
      const op1 = new Felt(0n);

      const { value, error } = vm.deduceOp0(instruction, dst, op1);
      expect(error).toBeUndefined();
      expect(value).toEqual([undefined, undefined]);
    });

    test('should return undefined for assert eq res logic mul with relocatables', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.AssertEq,
        ResLogic.Mul
      );
      const vm = new VirtualMachine();
      const dst = new Relocatable(1, 2);
      const op1 = new Relocatable(1, 3);

      const { value, error } = vm.deduceOp0(instruction, dst, op1);
      expect(error).toBeUndefined();
      expect(value).toEqual([undefined, undefined]);
    });

    test('should return undefined for assert eq res logic mul with undefined', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.AssertEq,
        ResLogic.Mul
      );
      const vm = new VirtualMachine();

      const { value, error } = vm.deduceOp0(instruction, undefined, undefined);
      expect(error).toBeUndefined();
      expect(value).toEqual([undefined, undefined]);
    });

    test('should deduce op0 and res for assert eq res logic add with felts', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.AssertEq,
        ResLogic.Add
      );
      const vm = new VirtualMachine();
      const dst = new Felt(7n);
      const op1 = new Felt(5n);

      const { value, error } = vm.deduceOp0(instruction, dst, op1);
      expect(error).toBeUndefined();
      expect(value).toEqual([new Felt(2n), dst]);
    });

    test('should deduce op0 and res for assert eq res logic add with relocatables', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.AssertEq,
        ResLogic.Add
      );
      const vm = new VirtualMachine();
      const dst = new Relocatable(1, 6);
      const op1 = new Relocatable(1, 2);

      const { value, error } = vm.deduceOp0(instruction, dst, op1);
      expect(error).toBeUndefined();
      expect(value).toEqual([new Felt(4n), dst]);
    });

    test('should return undefined for assert eq res logic add with undefined dst and op1', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.AssertEq,
        ResLogic.Add
      );
      const vm = new VirtualMachine();

      const { value, error } = vm.deduceOp0(instruction, undefined, undefined);
      expect(error).toBeUndefined();
      expect(value).toEqual([undefined, undefined]);
    });

    test('should deduce op0 for call', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.Call,
        ResLogic.Unconstrained
      );
      const vm = new VirtualMachine();

      const { value, error } = vm.deduceOp0(instruction, undefined, undefined);
      expect(error).toBeUndefined();
      expect(value).toEqual([new Relocatable(0, 1), undefined]);
    });
  });
});
