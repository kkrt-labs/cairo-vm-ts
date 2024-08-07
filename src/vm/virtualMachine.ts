import { ExpectedFelt, ExpectedRelocatable } from 'errors/primitives';
import { UndefinedSegmentValue } from 'errors/memory';
import {
  InvalidDst,
  InvalidOp1,
  UnusedRes,
  UndefinedInstruction,
  InvalidOp0,
  UndefinedOp0,
  InvalidCallOp0Value,
  UndefinedOp1,
  InvalidBufferResOp,
} from 'errors/virtualMachine';
import { DictNotFound } from 'errors/dictionary';
import { InvalidCellRefRegister, UnknownHint } from 'errors/hints';

import { Felt } from 'primitives/felt';
import { Relocatable } from 'primitives/relocatable';
import { SegmentValue, isFelt, isRelocatable } from 'primitives/segmentValue';
import { Memory } from 'memory/memory';

import {
  BinOp,
  CellRef,
  Deref,
  DoubleDeref,
  Immediate,
  Operation,
  OpType,
  ResOperand,
} from 'hints/hintParamsSchema';
import { Hint } from 'hints/hintSchema';
import { handlers, HintHandler } from 'hints/hintHandler';
import { Dictionary } from 'hints/dictionary';
import { ScopeManager } from 'hints/scopeManager';
import { SquashedDictManager } from 'hints/squashedDictManager';

import {
  ApUpdate,
  FpUpdate,
  Instruction,
  Op1Src,
  Opcode,
  PcUpdate,
  Register,
  ResLogic,
} from './instruction';

export type TraceEntry = {
  pc: Relocatable;
  ap: Relocatable;
  fp: Relocatable;
};

export type RelocatedTraceEntry = {
  pc: Felt;
  ap: Felt;
  fp: Felt;
};

export type RelocatedMemory = {
  address: number;
  value: Felt;
};

export class VirtualMachine {
  private currentStep: bigint;
  memory: Memory;
  pc: Relocatable;
  ap: Relocatable;
  fp: Relocatable;
  dictManager: Map<number, Dictionary>;
  squashedDictManager: SquashedDictManager;
  scopeManager: ScopeManager;
  trace: TraceEntry[];
  relocatedMemory: RelocatedMemory[];
  relocatedTrace: RelocatedTraceEntry[];

  private handlers: HintHandler = handlers;

  constructor() {
    this.currentStep = 0n;
    this.memory = new Memory();
    this.trace = [];
    this.relocatedMemory = [];
    this.relocatedTrace = [];

    this.pc = new Relocatable(0, 0);
    this.ap = new Relocatable(1, 0);
    this.fp = new Relocatable(1, 0);

    this.scopeManager = new ScopeManager();
    this.dictManager = new Map<number, Dictionary>();
    this.squashedDictManager = new SquashedDictManager();
  }

  /**
   * Execute one step:
   * - Execute hints at PC
   * - Decode the instruction at PC
   * - Run the instruction
   */
  step(hints?: Hint[]): void {
    hints?.forEach((hint) => this.executeHint(hint));
    const maybeEncodedInstruction = this.memory.get(this.pc);
    if (maybeEncodedInstruction === undefined) {
      throw new UndefinedInstruction(this.pc);
    }

    if (!isFelt(maybeEncodedInstruction)) {
      throw new ExpectedFelt(maybeEncodedInstruction);
    }

    const encodedInstruction = maybeEncodedInstruction.toBigInt();

    const instruction = Instruction.decodeInstruction(encodedInstruction);

    this.runInstruction(instruction);
  }

  /**
   * Execute a given hint
   */
  executeHint(hint: Hint) {
    const handler = this.handlers[hint.type];
    if (!handler) throw new UnknownHint(hint);
    handler(this, hint);
  }

  /**
   * Perform the state transition based on the given instruction
   * @param {Instruction} instruction Current instruction
   *
   * NOTE: See Cairo whitepaper 4.5 State Transition
   * for more details
   */
  runInstruction(instruction: Instruction): void {
    const { res, dst } = this.computeStepValues(instruction);

    this.trace.push({ pc: this.pc, ap: this.ap, fp: this.fp });

    this.updateRegisters(instruction, res, dst);

    this.currentStep += 1n;
  }

  /**
   * @param {Instruction} instruction Current instruction
   * @returns {Object} Auxiliary values (op0, op1, res, dst)
   * needed to run the given instruction.
   *
   * "They can be computed from the memory values,
   * the three offsets, and the instruction flags."
   */
  computeStepValues(instruction: Instruction): {
    op0: SegmentValue | undefined;
    op1: SegmentValue | undefined;
    res: SegmentValue | undefined;
    dst: SegmentValue | undefined;
  } {
    const {
      dstOffset,
      op0Offset,
      op1Offset,
      dstRegister,
      op0Register,
      op1Register,
      resLogic,
      opcode,
    } = instruction;

    const registers = {
      [Register.Pc]: this.pc,
      [Register.Ap]: this.ap,
      [Register.Fp]: this.fp,
    };

    const op0Addr: Relocatable = registers[op0Register].add(op0Offset);
    const dstAddr: Relocatable = registers[dstRegister].add(dstOffset);
    let op1Addr: Relocatable;

    let op0: SegmentValue | undefined = this.memory.get(op0Addr);
    switch (op1Register) {
      case Op1Src.Op0:
        if (!op0) throw new UndefinedOp0();
        if (!isRelocatable(op0)) throw new ExpectedFelt(op0);
        op1Addr = new Relocatable(op0.segmentId, op0.offset + op1Offset);
        break;
      default:
        op1Addr = registers[op1Register].add(op1Offset);
        break;
    }
    let op1: SegmentValue | undefined = this.memory.get(op1Addr);
    let res: SegmentValue | undefined = undefined;
    let dst: SegmentValue | undefined = this.memory.get(dstAddr);

    switch (opcode | resLogic) {
      case Opcode.Call | ResLogic.Op1:
        {
          const nextPc = this.pc.add(instruction.size());
          op0 = op0 ?? nextPc;
          if (!op0.eq(nextPc)) throw new InvalidCallOp0Value(op0, nextPc);
        }
        if (op1 === undefined) throw new UndefinedOp1();
        res = op1;
        dst = this.fp;
        break;

      case Opcode.Call | ResLogic.Add:
        {
          const nextPc = this.pc.add(instruction.size());
          op0 = op0 ?? nextPc;
          if (!op0.eq(nextPc)) throw new InvalidCallOp0Value(op0, nextPc);
        }
        if (op1 === undefined) throw new UndefinedOp1();
        res = op0.add(op1);
        dst = this.fp;
        break;

      case Opcode.Call | ResLogic.Mul:
        {
          const nextPc = this.pc.add(instruction.size());
          op0 = op0 ?? nextPc;
          if (!op0.eq(nextPc)) throw new InvalidCallOp0Value(op0, nextPc);
        }
        if (op1 === undefined) throw new UndefinedOp1();
        if (!isFelt(op0)) throw new ExpectedFelt(op0);
        res = op0.mul(op1);
        dst = this.fp;
        break;

      case Opcode.AssertEq | ResLogic.Op1:
        op1 = op1 ?? dst;
        res = op1;
        dst = res;
        break;

      case Opcode.AssertEq | ResLogic.Add:
        if (op0 === undefined) {
          if (dst === undefined || op1 === undefined) {
            throw new InvalidOp0();
          }
          op0 = dst.sub(op1);
        }
        if (op1 === undefined) {
          if (dst === undefined || op0 === undefined) {
            throw new InvalidOp1();
          }
          op1 = dst.sub(op0);
        }
        res = op0.add(op1);
        dst = res;
        break;

      case Opcode.AssertEq | ResLogic.Mul:
        if (op0 === undefined) {
          if (dst === undefined || op1 === undefined || !isFelt(dst)) {
            throw new InvalidOp0();
          }
          op0 = dst.div(op1);
        }
        if (!isFelt(op0)) throw new ExpectedFelt(op0);
        if (op1 === undefined) {
          if (dst === undefined || op0 === undefined || !isFelt(dst)) {
            throw new InvalidOp1();
          }
          op1 = dst.div(op0);
        }
        res = op0.mul(op1);
        dst = res;
        break;

      default:
        switch (resLogic) {
          case ResLogic.Op1:
            res = op1;
            break;

          case ResLogic.Add:
            if (op0 !== undefined && op1 !== undefined) {
              res = op0.add(op1);
            }
            break;

          case ResLogic.Mul:
            if (op0 !== undefined && op1 !== undefined && isFelt(op0)) {
              res = op0.mul(op1);
            }
            break;

          default:
            throw new Error();
        }
        break;
    }

    if (op0 !== undefined) this.memory.assertEq(op0Addr, op0);
    if (op1 !== undefined) this.memory.assertEq(op1Addr, op1);
    if (dst !== undefined) this.memory.assertEq(dstAddr, dst);

    return {
      op0,
      op1,
      res,
      dst,
    };
  }

  /**
   * Update the three registers PC, AP and FP.
   *
   * Based on the current instruction and
   * the previously computed auxiliary values.
   */
  updateRegisters(
    instruction: Instruction,
    res: SegmentValue | undefined,
    dst: SegmentValue | undefined
  ): void {
    this.updatePc(instruction, res, dst);
    this.updateFp(instruction, dst);
    this.updateAp(instruction, res);
  }

  /**
   * Update PC to its next value.
   *
   * Based on the current instruction and
   * the previously computed auxiliary values.
   */
  updatePc(
    instruction: Instruction,
    res: SegmentValue | undefined,
    dst: SegmentValue | undefined
  ): void {
    switch (instruction.pcUpdate) {
      case PcUpdate.Regular:
        this.pc = this.pc.add(instruction.size());
        break;

      case PcUpdate.Jump:
        if (res === undefined) throw new UnusedRes();
        if (!isRelocatable(res)) throw new ExpectedRelocatable(res);
        this.pc = res;
        break;

      case PcUpdate.JumpRel:
        if (res === undefined) throw new UnusedRes();
        if (!isFelt(res)) throw new ExpectedFelt(res);
        this.pc = this.pc.add(res);
        break;

      case PcUpdate.Jnz:
        if (dst === undefined) throw new InvalidDst();
        if (isFelt(dst) && dst.eq(Felt.ZERO)) {
          this.pc = this.pc.add(instruction.size());
        } else {
          if (res === undefined) throw new UndefinedOp1();
          if (!isFelt(res)) throw new ExpectedFelt(res);
          this.pc = this.pc.add(res);
        }
        break;
    }
  }

  /**
   * Update AP to its next value.
   *
   * Based on the current instruction and
   * the previously computed auxiliary values.
   */
  updateAp(instruction: Instruction, res: SegmentValue | undefined): void {
    switch (instruction.apUpdate) {
      case ApUpdate.AddRes:
        if (res === undefined) throw new UnusedRes();
        if (!isFelt(res)) throw new ExpectedFelt(res);

        this.ap = this.ap.add(res);
        break;

      case ApUpdate.Add1:
        this.ap = this.ap.add(1);
        break;

      case ApUpdate.Add2:
        this.ap = this.ap.add(2);
        break;
    }
  }

  /**
   * Update FP to its next value.
   *
   * Based on the current instruction and
   * the previously computed auxiliary values.
   */
  updateFp(instruction: Instruction, dst: SegmentValue | undefined): void {
    switch (instruction.fpUpdate) {
      case FpUpdate.ApPlus2:
        this.fp = this.ap.add(2);
        break;

      case FpUpdate.Dst:
        if (dst === undefined) throw new InvalidDst();
        if (isFelt(dst)) {
          this.fp = this.fp.add(dst);
        }
        if (isRelocatable(dst)) {
          this.fp = dst;
        }
        break;
    }
  }

  /**
   * Relocate memory and trace
   *
   * @param offset Sets the relocated memory start address to offset.
   *
   * NOTE: The current Solidity contract CpuVerifier.sol by StarkWare
   * expects the relocated memory to start at 1.
   *
   * See [issue #60](https://github.com/kkrt-labs/cairo-vm-ts/issues/60) for more details
   */
  relocate(offset: number = 0) {
    /*
     * Each element of the relocationTable is the start address
     * of a segment in the relocated memory.
     * This address is the sum of the length of all previous segments,
     * plus one if complying with StarkWare current verifier
     */
    const relocationTable = this.memory.segments
      .map((segment) => segment.length)
      .map(
        (
          (sum) => (value) =>
            (sum += value) - value
        )(offset)
      );

    this.relocatedMemory = this.memory.segments.flatMap((segment, index) =>
      segment.map((value, offset) => ({
        address: relocationTable[index] + offset,
        value: isFelt(value)
          ? value
          : new Felt(BigInt(relocationTable[value.segmentId] + value.offset)),
      }))
    );

    this.relocatedTrace = this.trace.map(({ pc, ap, fp }) => ({
      pc: new Felt(BigInt(relocationTable[pc.segmentId] + pc.offset)),
      ap: new Felt(BigInt(relocationTable[ap.segmentId] + ap.offset)),
      fp: new Felt(BigInt(relocationTable[fp.segmentId] + fp.offset)),
    }));

    this.trace
      .flatMap(Object.values)
      .map(
        (register: Relocatable) =>
          new Felt(
            BigInt(relocationTable[register.segmentId] + register.offset)
          )
      );
  }

  relocatedMemoryToString(): string {
    return [
      '\nRELOCATED MEMORY',
      'Address  ->  Value',
      '-----------------',
      ...this.relocatedMemory.map(
        ({ address, value }) => `${address} -> ${value.toString()}`
      ),
    ]
      .flat()
      .join('\n');
  }

  /**
   * Return the memory address defined by `cell`
   *
   * NOTE: used in Cairo hints
   */
  cellRefToRelocatable(cell: CellRef): Relocatable {
    let register: Relocatable;
    switch (cell.register) {
      case Register.Ap:
        register = this.ap;
        break;
      case Register.Fp:
        register = this.fp;
        break;
      case Register.Pc:
        throw new InvalidCellRefRegister(cell);
    }
    return register.add(cell.offset);
  }

  /**
   * Return `[cell] + offset`
   *
   * Expect a Relocatable at `cell`, throw otherwise
   *
   * NOTE: used in Cairo hints
   */
  getPointer(cell: CellRef, offset: Felt) {
    const address = this.memory.get(this.cellRefToRelocatable(cell));
    if (!address || !isRelocatable(address))
      throw new ExpectedRelocatable(address);
    return address.add(offset);
  }

  /**
   * Return the memory value at the address defined by `cell`
   *
   * Expect a Felt, throw otherwise
   *
   * NOTE: used in Cairo hints
   */
  getFelt(cell: CellRef): Felt {
    const value = this.memory.get(this.cellRefToRelocatable(cell));
    if (!value || !isFelt(value)) throw new ExpectedFelt(value);
    return value;
  }

  /**
   * Return the memory value at the address defined by `cell`
   *
   * Expect a Relocatable, throw otherwise
   *
   * NOTE: used in Cairo hints
   */
  getRelocatable(cell: CellRef): Relocatable {
    const value = this.memory.get(this.cellRefToRelocatable(cell));
    if (!value || !isRelocatable(value)) throw new ExpectedRelocatable(value);
    return value;
  }

  /**
   * Return the memory value at the address defined by `cell`
   *
   * Throw if the value is `undefined`
   *
   * NOTE: used in Cairo hints
   */
  getSegmentValue(cell: CellRef): SegmentValue {
    const value = this.memory.get(this.cellRefToRelocatable(cell));
    if (!value) throw new UndefinedSegmentValue();
    return value;
  }

  /**
   * Get the Felt defined by `resOperand`
   *
   * @param resOperand - The ResOperand to extract a Felt from.
   * @returns {Felt} The value expressed by the given ResOperand.
   */
  getResOperandValue(resOperand: ResOperand): Felt {
    const value = this.getResOperandSegmentValue(resOperand);
    if (!isFelt(value)) throw new ExpectedFelt(value);
    return value;
  }

  /**
   * Get the Relocatable defined by `resOperand`
   *
   * @param resOperand - The ResOperand to extract a Relocatable from.
   * @returns {Relocatable} The value expressed by the given ResOperand.
   */
  getResOperandRelocatable(resOperand: ResOperand): Relocatable {
    const value = this.getResOperandSegmentValue(resOperand);
    if (!isRelocatable(value)) throw new ExpectedRelocatable(value);
    return value;
  }

  /**
   * Return the SegmentValue value defined by `resOperand`
   *
   * Generic patterns:
   * - Deref: `[register + offset]`
   * - DoubleDeref: `[[register + offset1] + offset2]`
   * - Immediate: `0x1000`
   * - BinOp (Add): `[register1 + offset1] + [register2 + offset2]`
   * or `[register1 + offset1] + immediate`
   * - BinOp (Mul): `[register1 + offset1] * [register2 + offset2]`
   * or `[register1 + offset1] * immediate`
   *
   * @param {ResOperand} resOperand - The ResOperand to extract a Felt from.
   * @returns {Felt} The value expressed by the given ResOperand.
   * @throws {ExpectedFelt} If ResOperand is a BinOp (Mul) with `a` being a Relocatable.
   *
   * NOTE: used in Cairo hints
   */
  getResOperandSegmentValue(resOperand: ResOperand): SegmentValue {
    switch (resOperand.type) {
      case OpType.Deref:
        return this.getSegmentValue((resOperand as Deref).cell);

      case OpType.DoubleDeref:
        const dDeref = resOperand as DoubleDeref;
        const deref = this.getRelocatable(dDeref.cell);
        const value = this.memory.get(deref.add(dDeref.offset));
        if (!value) throw new UndefinedSegmentValue();
        return value;

      case OpType.Immediate:
        return (resOperand as Immediate).value;

      case OpType.BinOp:
        const binOp = resOperand as BinOp;
        const a = this.getSegmentValue(binOp.a);

        let b: Felt | undefined = undefined;
        switch (binOp.b.type) {
          case OpType.Deref:
            b = this.getFelt((binOp.b as Deref).cell);
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
            if (!isFelt(a)) throw new ExpectedFelt(a);
            return a.mul(b);
        }
    }
  }

  /**
   * Return the address defined at `resOperand`.
   *
   * This method assume that resOperand points to a Relocatable.
   *
   * Only Deref and BinOp with Immediate value are valid for extracting a buffer.
   *
   * NOTE: Used in Cairo hints.
   */
  extractBuffer(resOperand: ResOperand): [CellRef, Felt] {
    switch (resOperand.type) {
      case OpType.Deref:
        return [(resOperand as Deref).cell, new Felt(0n)];
      case OpType.BinOp:
        const binOp = resOperand as BinOp;
        if (binOp.b.type !== OpType.Immediate)
          throw new InvalidBufferResOp(resOperand);
        return [binOp.a, (binOp.b as Immediate).value];
      default:
        throw new InvalidBufferResOp(resOperand);
    }
  }

  /**
   * Creates a new dictionary.
   *
   * NOTE: used in Cairo hints
   */
  newDict(): Relocatable {
    const dictAddr = this.memory.addSegment();
    this.dictManager.set(
      dictAddr.segmentId,
      new Dictionary(new Felt(BigInt(this.dictManager.size)))
    );
    return dictAddr;
  }

  /**
   * Return the dictionary at `address`
   *
   * Throw if dictionary was not found
   *
   * NOTE: used in Cairo hints
   */
  getDict(address: Relocatable): Dictionary {
    const dict = this.dictManager.get(address.segmentId);
    if (!dict) throw new DictNotFound(address);
    return dict;
  }
}
