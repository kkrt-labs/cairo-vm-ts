import { describe, expect, test } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';

import { Felt } from 'primitives/felt';
import { Relocatable } from 'primitives/relocatable';
import { parseProgram } from 'vm/program';
import { CairoRunner } from './cairoRunner';

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
      runner.runUntilPc(runner.finalPc, false, false);
      const executionSize = runner.vm.memory.getSegmentSize(1);
      const executionEnd = runner.executionBase.add(executionSize);

      expect(runner.vm.memory.get(executionEnd.sub(1))).toEqual(new Felt(144n));
    });

    test('should export encoded trace and memory', () => {
      const runner = new CairoRunner(PROGRAM);
      runner.runUntilPc(runner.finalPc, true, true);
      const dir = 'tmp';
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      const trace_filename = 'fibonacci_trace_ts.bin';
      const memory_filename = 'fibonacci_memory_ts.bin';
      runner.exportTrace(path.join(dir, trace_filename));
      runner.exportMemory(path.join(dir, memory_filename));
    });
  });
});
