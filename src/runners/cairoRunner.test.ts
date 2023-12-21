import { describe, expect, test } from 'bun:test';
import { parseProgram } from 'vm/program';
import * as fs from 'fs';
import { CairoRunner } from './cairoRunner';
import { Relocatable } from 'primitives/relocatable';
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
      expect(runner.mainOffset).toEqual(0);
      expect(runner.programBase).toEqual(new Relocatable(0, 0));
      expect(runner.executionBase).toEqual(new Relocatable(1, 0));
      expect(runner.initialFp).toEqual(new Relocatable(1, 2));
      expect(runner.initialAp).toEqual(new Relocatable(1, 2));
      expect(runner.finalPc).toEqual(new Relocatable(3, 0));
      expect(runner.initialPc).toEqual(new Relocatable(0, 0));
    });
  });

  describe('runUntilPc', () => {
    test('should return the value of the 10th fibonacci number', () => {
      const runner = new CairoRunner(PROGRAM);
      const finalPc = new Relocatable(0, 12);
      runner.runUntilPc(finalPc, false);
      const executionSize = runner.vm.memory.getSegmentSize(1);
      const executionEnd = runner.executionBase.add(executionSize);

      expect(runner.vm.memory.get(executionEnd.sub(1))).toEqual(new Felt(144n));
    });
  });
});
