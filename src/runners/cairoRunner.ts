import * as fs from 'fs';

import {
  CairoZeroHintsNotSupported,
  EmptyRelocatedMemory,
  UndefinedEntrypoint,
  InvalidBuiltins,
  MissingEndLabel,
  UndefinedBuiltinSegment,
  InsufficientAllocatedCells,
} from 'errors/cairoRunner';

import { Felt } from 'primitives/felt';
import { isFelt, SegmentValue } from 'primitives/segmentValue';
import { Relocatable } from 'primitives/relocatable';
import { CairoProgram, CairoZeroProgram, Program } from 'vm/program';
import { RcLimits, VirtualMachine } from 'vm/virtualMachine';
import { CELLS_PER_INSTANCE, getBuiltin } from 'builtins/builtin';
import { Hint, Hints } from 'hints/hintSchema';
import {
  isSubsequence,
  Layout,
  layouts,
  MEMORY_UNITS_PER_STEP,
} from './layout';
import { nextPowerOfTwo } from 'primitives/utils';
import { ExpectedFelt } from 'errors/primitives';
import {
  INNER_RC_BOUND_MASK,
  INNER_RC_BOUND_SHIFT,
  RC_N_PARTS,
  RC_N_PARTS_96,
} from 'builtins/rangeCheck';
import { KECCAK_DILUTED_CELLS } from 'builtins/keccak';

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

const MISSING_STEPS_CAPACITY = -1;

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
    const isProofMode = this.mode !== RunnerMode.ExecutionMode;

    if (isProofMode) {
      this.runFor(nextPowerOfTwo(this.vm.currentStep));
      while (!this.checkCellUsage()) {
        this.runFor(1);
        this.runFor(nextPowerOfTwo(this.vm.currentStep) - this.vm.currentStep);
      }
    }

    if (isProofMode || relocate) this.vm.relocate(offset);
  }

  /**
   * Execute a fixed number of steps.
   *
   * @param steps - The number of steps to execute.
   */
  runFor(steps: number) {
    for (let i = 0; i < steps; i++) {
      this.vm.step(this.hints.get(this.vm.pc.offset));
    }
  }

  /**
   * @returns {boolean} Whether there are enough allocated cells for
   * generating a proof of this program execution for the chosen layout.
   * @throws {InsufficientAllocatedCells} - If the number of allocated cells of the layout is insufficient.
   *
   */
  checkCellUsage(): boolean {
    const builtinChecks = this.builtins
      .filter((builtin) => !['gas_builtin', 'system'].includes(builtin))
      .map((builtin) => {
        const { size, capacity } = this.getSizeAndCapacity(builtin);
        if (capacity === MISSING_STEPS_CAPACITY) return false;
        if (size > capacity) {
          throw new InsufficientAllocatedCells(
            this.layout.name,
            size,
            capacity
          );
        }
        return true;
      })
      .reduce((prev, curr) => prev && curr);

    const initialBounds: RcLimits = { rcMin: 0, rcMax: 1 };
    const { rcMin, rcMax }: RcLimits = this.builtins
      .filter((builtin) => ['range_check', 'range_check96'].includes(builtin))
      .map((builtin) => {
        const segment = this.getBuiltinSegment(builtin);
        if (!segment) throw new UndefinedBuiltinSegment(builtin);
        if (!segment.length) return { rcMin: 0, rcMax: 0 };
        return segment.reduce((_, value) => {
          if (!isFelt(value)) throw new ExpectedFelt(value);
          const nParts = builtin === 'range_check' ? RC_N_PARTS : RC_N_PARTS_96;
          return value
            .to64BitsWords()
            .flatMap((limb) =>
              [3, 2, 1, 0].map(
                (i) =>
                  (limb >> BigInt(i * INNER_RC_BOUND_SHIFT)) &
                  INNER_RC_BOUND_MASK
              )
            )
            .slice(nParts)
            .reduce((bounds, curr) => {
              const x = Number(curr);
              return {
                rcMin: Math.min(bounds.rcMin, x),
                rcMax: Math.max(bounds.rcMax, x),
              };
            }, initialBounds);
        }, initialBounds);
      })
      .concat([this.vm.rcLimits])
      .reduce((acc, curr) => ({
        rcMin: Math.min(acc.rcMin, curr.rcMin),
        rcMax: Math.max(curr.rcMin, curr.rcMax),
      }));

    const usedRcUnits = this.builtins
      .filter((builtin) => ['range_check', 'range_check96'].includes(builtin))
      .map((builtin) => {
        const segment = this.getBuiltinSegment(builtin);
        if (!segment) throw new UndefinedBuiltinSegment(builtin);
        return builtin === 'range_check'
          ? segment.length * RC_N_PARTS
          : segment.length * RC_N_PARTS_96;
      })
      .reduce((acc, curr) => acc + curr);

    const unusedRcUnits =
      (this.layout.rcUnits - 3) * this.vm.currentStep - usedRcUnits;
    const rcUnitsCheck = unusedRcUnits >= rcMax - rcMin;

    const builtinsCapacity = this.builtins
      .map((builtin) => this.getSizeAndCapacity(builtin).capacity)
      .reduce((acc, curr) => acc + curr);
    const totalMemoryCapacity = this.vm.currentStep * MEMORY_UNITS_PER_STEP;
    if (totalMemoryCapacity % this.layout.publicMemoryFraction)
      throw new Error(
        'Total memory capacity is not a multiple of public memory fraction.'
      );
    const publicMemoryCapacity =
      totalMemoryCapacity / this.layout.publicMemoryFraction;

    const instructionCapacity = this.vm.currentStep * 4;
    const unusedMemoryCapacity =
      totalMemoryCapacity -
      (publicMemoryCapacity + instructionCapacity + builtinsCapacity);
    const memoryHoles = this.vm.memory.segments.reduce(
      (acc, currSegment) =>
        acc + currSegment.reduce((acc, _) => acc--, currSegment.length),
      0
    );
    const memoryCheck = unusedMemoryCapacity >= memoryHoles;

    let dilutedCheck: boolean = true;
    const dilutedPool = this.layout.dilutedPool;
    if (dilutedPool) {
      const dilutedUsedCapacity = this.builtins
        .filter((builtin) => ['bitwise', 'keccak'].includes(builtin))
        .map((builtin) => {
          const multiplier =
            this.layout.name === 'dynamic'
              ? this.vm.currentStep
              : this.vm.currentStep / this.layout.ratios[builtin];
          if (builtin === 'bitwise') {
            const totalNBits = 251;
            const { nBits, spacing } = dilutedPool;
            const step = nBits * spacing;
            const partition: number[] = [];
            for (let i = 0; i < totalNBits; i += step) {
              for (let j = 0; j < spacing; j++) {
                if (i + j < totalNBits) {
                  partition.push(i + j);
                }
              }
            }
            const trimmedNumber = partition.filter(
              (value) => value + spacing * (nBits - 1) + 1 > totalNBits
            ).length;

            return (4 * partition.length + trimmedNumber) * multiplier;
          }
          return (KECCAK_DILUTED_CELLS / dilutedPool.nBits) * multiplier;
        })
        .reduce((acc, curr) => acc + curr);

      const dilutedUnits = this.vm.currentStep * dilutedPool.unitsPerStep;
      const unusedDilutedCapacity = dilutedUnits - dilutedUsedCapacity;
      dilutedCheck = unusedDilutedCapacity >= 1 << dilutedPool.nBits;
    }

    return builtinChecks && rcUnitsCheck && memoryCheck && dilutedCheck;
  }

  /** @returns The size of a builtin and its capacity for the chosen layout. */
  private getSizeAndCapacity(builtin: string): {
    size: number;
    capacity: number;
  } {
    const segment = this.getBuiltinSegment(builtin);
    if (!segment) throw new UndefinedBuiltinSegment(builtin);
    const size =
      builtin === 'segment_arena' ? segment.length - 3 : segment.length;

    if (builtin === 'output' || builtin === 'segment_arena') {
      return { size, capacity: size };
    }

    const ratio = this.layout.ratios[builtin];
    const cellsPerInstance = CELLS_PER_INSTANCE[builtin];
    let capacity: number = 0;

    switch (this.layout.name) {
      case 'dynamic':
        const instances = Math.ceil(size / cellsPerInstance);
        const instancesPerComponent = builtin === 'keccak' ? 16 : 1;
        const components = nextPowerOfTwo(instances / instancesPerComponent);
        capacity = cellsPerInstance * instancesPerComponent * components;
        break;
      default:
        const minStep = ratio * cellsPerInstance;
        if (this.vm.currentStep < minStep) {
          return { size, capacity: MISSING_STEPS_CAPACITY };
        }
        capacity = (this.vm.currentStep / ratio) * cellsPerInstance;
        break;
    }

    return { size, capacity };
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
