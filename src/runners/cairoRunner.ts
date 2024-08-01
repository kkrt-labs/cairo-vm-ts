import * as fs from 'fs';

import {
  CairoZeroHintsNotSupported,
  EmptyRelocatedMemory,
  UndefinedEntrypoint,
  InvalidBuiltins,
  MissingEndLabel,
} from 'errors/cairoRunner';

import { Felt } from 'primitives/felt';
import { SegmentValue } from 'primitives/segmentValue';
import { Relocatable } from 'primitives/relocatable';
import { CairoProgram, CairoZeroProgram, Program } from 'vm/program';
import { VirtualMachine } from 'vm/virtualMachine';
import { getBuiltin } from 'builtins/builtin';
import { Hint, Hints } from 'hints/hintSchema';
import { isSubsequence, Layout, layouts } from './layout';

/**
 * Configuration of the run
 * - relocate: Flag to relocate the memory and the trace
 * - offset: Start address of the relocated memory
 */
export type RunOptions = {
  relocate: boolean;
  offset: number;
};

export enum RunnerMode {
  ExecutionMode = 'Execution Mode',
  ProofModeCairoZero = 'Proof Mode - Cairo Zero',
  ProofModeCairo = 'Proof Mode - Cairo',
}

export class CairoRunner {
  program: Program;
  layout: Layout;
  mode: RunnerMode;
  hints: Hints;
  vm: VirtualMachine;
  programBase: Relocatable;
  executionBase: Relocatable;
  builtins: string[];
  finalPc: Relocatable;

  static readonly defaultRunOptions: RunOptions = {
    relocate: false,
    offset: 0,
  };

  constructor(
    program: Program,
    bytecode: Felt[],
    layoutName: string = 'plain',
    mode: RunnerMode = RunnerMode.ExecutionMode,
    initialPc: number = 0,
    builtins: string[] = [],
    hints: Hints = new Map<number, Hint[]>()
  ) {
    this.program = program;
    this.mode = mode;
    this.hints = hints;
    this.vm = new VirtualMachine();
    this.programBase = this.vm.memory.addSegment();
    this.executionBase = this.vm.memory.addSegment();

    this.layout = layouts[layoutName];
    const allowedBuiltins = this.layout.builtins.concat([
      'segment_arena',
      'gas_builtin',
      'system',
    ]);
    if (!isSubsequence(builtins, allowedBuiltins))
      throw new InvalidBuiltins(builtins, this.layout.builtins, layoutName);

    const isProofMode = mode !== RunnerMode.ExecutionMode;
    this.builtins = isProofMode
      ? [...new Set(this.layout.builtins.concat(builtins))]
      : builtins;
    const builtin_stack = this.builtins
      .map((builtin) => {
        const handler = getBuiltin(builtin);
        let base: Relocatable;
        if (builtin === 'segment_arena') {
          const initialValues = [
            this.vm.memory.addSegment(handler),
            new Felt(0n),
            new Felt(0n),
          ];
          base = this.vm.memory.addSegment(handler);
          initialValues.map((value, offset) =>
            this.vm.memory.assertEq(base.add(offset), value)
          );
          base = base.add(initialValues.length);
        } else {
          base = this.vm.memory.addSegment(handler);
        }
        if (isProofMode) {
          return builtins.includes(builtin) ? base : 0;
        }
        return base;
      })
      .filter((value) => value !== 0);

    let stack: SegmentValue[] = [];
    let apOffset: number = 0;
    switch (mode) {
      case RunnerMode.ExecutionMode:
        const returnFp = this.vm.memory.addSegment();
        this.finalPc = this.vm.memory.addSegment();
        stack = [...builtin_stack, returnFp, this.finalPc];
        apOffset = stack.length;
        break;

      case RunnerMode.ProofModeCairoZero:
        const finalPc = (program as CairoZeroProgram).identifiers.get(
          '__main__.__end__'
        )?.pc;
        if (!finalPc) throw new MissingEndLabel();
        this.finalPc = this.programBase.add(finalPc);

        stack = [this.executionBase.add(2), new Felt(0n), ...builtin_stack];
        apOffset = 2;
        break;
      case RunnerMode.ProofModeCairo:
        const retFp = this.vm.memory.addSegment();
        this.finalPc = this.vm.memory.addSegment();
        const jmpRelInstruction = new Felt(BigInt('0x10780017FFF7FFF'));
        this.vm.memory.assertEq(this.finalPc, jmpRelInstruction);
        this.vm.memory.assertEq(this.finalPc.add(1), new Felt(0n));

        stack = [...builtin_stack, retFp, this.finalPc];
        apOffset = stack.length;
        break;
    }

    this.vm.pc = this.programBase.add(initialPc);
    this.vm.ap = this.executionBase.add(apOffset);
    this.vm.fp = this.vm.ap;

    this.vm.memory.setValues(this.programBase, bytecode);
    this.vm.memory.setValues(this.executionBase, stack);
  }

  /** Instantiate a CairoRunner from parsed Cairo Zero compilation artifacts. */
  static fromCairoZeroProgram(
    program: CairoZeroProgram,
    layoutName: string = 'plain',
    proofMode: boolean = false,
    fnName: string = 'main'
  ): CairoRunner {
    const identifier = proofMode ? '__start__' : fnName;
    const id = program.identifiers.get('__main__.'.concat(identifier));
    if (!id) throw new UndefinedEntrypoint(identifier);
    const offset = id.pc;

    const builtins = program.builtins;
    const mode = proofMode
      ? RunnerMode.ProofModeCairoZero
      : RunnerMode.ExecutionMode;

    if (program.hints.length) throw new CairoZeroHintsNotSupported();

    return new CairoRunner(
      program,
      program.data,
      layoutName,
      mode,
      offset,
      builtins
    );
  }

  /** Instantiate a CairoRunner from parsed Cairo compilation artifacts. */
  static fromCairoProgram(
    program: CairoProgram,
    layoutName: string = 'plain',
    proofMode: boolean = false,
    fnName: string = 'main'
  ): CairoRunner {
    const fn = program.entry_points_by_function[fnName];
    if (!fn) throw new UndefinedEntrypoint(fnName);
    const mode = proofMode
      ? RunnerMode.ProofModeCairo
      : RunnerMode.ExecutionMode;

    const offset = proofMode ? 0 : fn.offset;
    return new CairoRunner(
      program,
      program.bytecode,
      layoutName,
      mode,
      offset,
      fn.builtins,
      program.hints
    );
  }

  /** Instantiate a CairoRunner from any Cairo or Cairo Zero compilation artifacts. */
  static fromProgram(
    program: Program,
    layout: string = 'plain',
    proofMode: boolean = false,
    fnName: string = 'main'
  ) {
    if (program.compiler_version.split('.')[0] == '0') {
      return CairoRunner.fromCairoZeroProgram(
        program as CairoZeroProgram,
        layout,
        proofMode,
        fnName
      );
    }
    return CairoRunner.fromCairoProgram(
      program as CairoProgram,
      layout,
      proofMode,
      fnName
    );
  }

  /**
   * Run the loaded program with the given config
   */
  run(config: RunOptions = CairoRunner.defaultRunOptions): void {
    while (!this.vm.pc.eq(this.finalPc)) {
      this.vm.step(this.hints.get(this.vm.pc.offset));
    }
    const { relocate, offset } = config;
    if (relocate) this.vm.relocate(offset);
  }

  /**
   * Export the trace little-endian encoded to a file
   *
   * @dev DataView must be used to enforce little-endianness
   */
  exportTrace(filename: string = 'encoded_trace') {
    const buffer = new ArrayBuffer(this.vm.relocatedTrace.length * 3 * 8);
    const view = new DataView(buffer);

    this.vm.relocatedTrace.forEach(({ pc, ap, fp }, step) => {
      const byteOffset = step * 3 * 8;
      view.setBigUint64(byteOffset, ap.toBigInt(), true);
      view.setBigUint64(byteOffset + 8, fp.toBigInt(), true);
      view.setBigUint64(byteOffset + 2 * 8, pc.toBigInt(), true);
    });

    fs.writeFileSync(filename, Buffer.from(buffer), { flag: 'w+' });
  }

  /**
   * Export the relocated memory little-endian encoded to a file
   *
   * @param offset - Start address of the relocated memory.  Defaults to 0.
   *
   *
   * NOTE: StarkWare verifier expects offset to be 1.
   * @dev DataView must be used to enforce little-endianness
   */
  exportMemory(filename: string = 'encoded_memory') {
    if (!this.vm.relocatedMemory.length) throw new EmptyRelocatedMemory();

    const buffer = new ArrayBuffer(this.vm.relocatedMemory.length * 5 * 8);
    const view = new DataView(buffer);

    this.vm.relocatedMemory.forEach(({ address, value }, index) => {
      const byteOffset = index * 5 * 8;
      const valueAs64BitsWords = value.to64BitsWords();
      view.setBigUint64(byteOffset, BigInt(address), true);
      view.setBigUint64(byteOffset + 8, valueAs64BitsWords[0], true);
      view.setBigUint64(byteOffset + 2 * 8, valueAs64BitsWords[1], true);
      view.setBigUint64(byteOffset + 3 * 8, valueAs64BitsWords[2], true);
      view.setBigUint64(byteOffset + 4 * 8, valueAs64BitsWords[3], true);
    });

    fs.writeFileSync(filename, Buffer.from(buffer), { flag: 'w+' });
  }

  /** @returns The builtin segment from a given name */
  getBuiltinSegment(name: string): SegmentValue[] | undefined {
    const builtinId = this.builtins.indexOf(name);
    const segmentArenaId = this.builtins.indexOf('segment_arena');

    if (builtinId === -1) return undefined;

    const offset = segmentArenaId !== -1 && builtinId >= segmentArenaId ? 3 : 2;
    return this.vm.memory.segments[builtinId + offset];
  }

  /** @returns The output builtin segment. */
  getOutput() {
    return this.getBuiltinSegment('output') ?? [];
  }
}
