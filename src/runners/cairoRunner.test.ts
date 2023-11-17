import { describe, expect, test } from 'bun:test';
import { parseProgram } from 'vm/program';
import * as fs from 'fs';
import { CairoRunner } from './cairoRunner';
import { Relocatable } from 'primitives/relocatable';
import { Uint32 } from 'primitives/uint';
import { Felt } from 'primitives/felt';

const FIBONACCI_PROGRAM_STRING = fs.readFileSync(
  'cairo_programs/cairo_0/fibonacci.json',
  'utf8'
);
const PROGRAM = parseProgram(FIBONACCI_PROGRAM_STRING);

describe('cairoRunner', () => {
  describe('constructor', () => {
    test('should construct', () => {
      const runner = new CairoRunner(PROGRAM);
      expect(runner.getMainOffset()).toEqual(0 as Uint32);
    });
  });

  describe('runUntilPc', () => {
    test('should return the value of the 10th fibonacci number', () => {
      const runner = new CairoRunner(PROGRAM);
      runner.initialize();
      const finalPc = new Relocatable(0, 12);
      const { error } = runner.runUntilPc(finalPc);
      const executionSize = runner.getVm().segments.getSegmentSize(1 as Uint32);
      const executionEnd = runner.getExecutionBase().add(executionSize).value;

      expect(error).toBeUndefined();
      expect(runner.getVm().segments.memory.get(executionEnd)).toEqual(
        new Felt(144n)
      );
    });
  });

  describe('initializeSegments', () => {
    test('should initialize segments', () => {
      const runner = new CairoRunner(PROGRAM);
      runner.initializeSegments();

      expect(runner.getProgramBase()).toEqual(new Relocatable(0, 0));
      expect(runner.getExecutionBase()).toEqual(new Relocatable(1, 0));
    });
  });

  describe('initializeMainEntrypoint', () => {
    test('should initialize main entrypoint', () => {
      const runner = new CairoRunner(PROGRAM);
      runner.initializeSegments();
      runner.initializeMainEntrypoint();

      expect(runner.getInitialFp()).toEqual(new Relocatable(1, 2));
      expect(runner.getInitialAp()).toEqual(new Relocatable(1, 2));
      expect(runner.getFinalPc()).toEqual(new Relocatable(3, 0));
    });
  });

  describe('initializeState', () => {
    test('should initialize the state', () => {
      const runner = new CairoRunner(PROGRAM);
      runner.initializeSegments();
      const entrypoint = 5 as Uint32;
      const stack = [new Relocatable(2, 0), new Relocatable(3, 0)];
      runner.initializeState(entrypoint, stack);

      expect(runner.getInitialPc()).toEqual(new Relocatable(0, 5));
      const executionBase = runner.getExecutionBase();
      expect(runner.getVm().segments.memory.get(executionBase)).toEqual(
        stack[0]
      );
      const executionBasePlusOne = executionBase.add(1 as Uint32).value;
      expect(runner.getVm().segments.memory.get(executionBasePlusOne)).toEqual(
        stack[1]
      );
    });
  });
});
