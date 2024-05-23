import { describe, expect, test } from 'bun:test';

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import { Felt } from 'primitives/felt';
import { Relocatable } from 'primitives/relocatable';
import { parseProgram } from 'vm/program';
import { CairoRunner } from './cairoRunner';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cairo-vm-ts-'));

const FIBONACCI_PROGRAM_STRING = fs.readFileSync(
  'cairo_programs/cairo_0/fibonacci.json',
  'utf8'
);
const PROGRAM = parseProgram(FIBONACCI_PROGRAM_STRING);

describe('cairoRunner', () => {
  describe('constructor', () => {
    test('should construct', () => {
      const runner = new CairoRunner(PROGRAM);
      expect(runner.programBase).toEqual(new Relocatable(0, 0));
      expect(runner.executionBase).toEqual(new Relocatable(1, 0));
      expect(runner.vm.pc).toEqual(new Relocatable(0, 0));
      expect(runner.vm.ap).toEqual(new Relocatable(1, 2));
      expect(runner.vm.fp).toEqual(new Relocatable(1, 2));
      expect(runner.finalPc).toEqual(new Relocatable(3, 0));
    });
  });

  describe('runUntilPc', () => {
    test('should return the value of the 10th fibonacci number', () => {
      const runner = new CairoRunner(PROGRAM);
      runner.runUntilPc(runner.finalPc, true, 0);
      const executionSize = runner.vm.memory.getSegmentSize(1);
      const executionEnd = runner.executionBase.add(executionSize);

      expect(runner.vm.memory.get(executionEnd.sub(1))).toEqual(new Felt(144n));
    });

    /*
     * TODO: Add differential testing of the content
     * See this [issue](https://github.com/kkrt-labs/cairo-vm-ts/issues/59) for more details

     * NOTE: `fs.access` is only used when checking if a file exists
     * It should be removed if reading the file, to avoid race conditions
    */
    test('should export encoded trace', () => {
      const runner = new CairoRunner(PROGRAM);
      runner.runUntilPc(runner.finalPc, true, 1);
      const trace_filename = 'fibonacci_trace_ts.bin';
      const trace_path = path.join(tmpDir, trace_filename);
      runner.exportTrace(trace_path);
      expect(() =>
        fs.access(trace_path, (err) => {
          if (err) throw err;
        })
      ).not.toThrow();
    });

    test('should export encoded memory', () => {
      const runner = new CairoRunner(PROGRAM);
      runner.runUntilPc(runner.finalPc, true, 1);
      const memory_filename = 'fibonacci_memory_ts.bin';
      const memory_path = path.join(tmpDir, memory_filename);
      runner.exportMemory(memory_path);
      expect(() =>
        fs.access(memory_path, (err) => {
          if (err) throw err;
        })
      ).not.toThrow();
    });
  });
});
