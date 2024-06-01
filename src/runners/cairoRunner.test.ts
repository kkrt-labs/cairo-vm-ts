import { describe, expect, test } from 'bun:test';

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import { Felt } from 'primitives/felt';
import { Relocatable } from 'primitives/relocatable';
import { parseProgram } from 'vm/program';
import { CairoRunner, RunOptions } from './cairoRunner';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cairo-vm-ts-'));

const FIBONACCI_PROGRAM_STRING = fs.readFileSync(
  'cairo_programs/cairo_0/fibonacci.json',
  'utf8'
);
const BITWISE_PROGRAM_STRING = fs.readFileSync(
  'cairo_programs/cairo_0/bitwise_test.json',
  'utf8'
);
const EC_OP_PROGRAM_STRING = fs.readFileSync(
  'cairo_programs/cairo_0/ecop_builtin.json',
  'utf8'
);

const PEDERSEN_PROGRAM_STRING = fs.readFileSync(
  'cairo_programs/cairo_0/pedersen_builtin.json',
  'utf8'
);

const POSEIDON_PROGRAM_STRING = fs.readFileSync(
  'cairo_programs/cairo_0/poseidon_builtin.json',
  'utf8'
);

const FIBONACCI_PROGRAM = parseProgram(FIBONACCI_PROGRAM_STRING);
const BITWISE_PROGRAM = parseProgram(BITWISE_PROGRAM_STRING);
const EC_OP_PROGRAM = parseProgram(EC_OP_PROGRAM_STRING);
const PEDERSEN_PROGRAM = parseProgram(PEDERSEN_PROGRAM_STRING);
const POSEIDON_PROGRAM = parseProgram(POSEIDON_PROGRAM_STRING);

describe('cairoRunner', () => {
  describe('constructor', () => {
    test('should construct', () => {
      const runner = new CairoRunner(FIBONACCI_PROGRAM);
      expect(runner.programBase).toEqual(new Relocatable(0, 0));
      expect(runner.executionBase).toEqual(new Relocatable(1, 0));
      expect(runner.vm.pc).toEqual(new Relocatable(0, 0));
      expect(runner.vm.ap).toEqual(new Relocatable(1, 2));
      expect(runner.vm.fp).toEqual(new Relocatable(1, 2));
      expect(runner.finalPc).toEqual(new Relocatable(3, 0));
    });
  });

  describe('run', () => {
    test('should return the value of the 10th fibonacci number', () => {
      const runner = new CairoRunner(FIBONACCI_PROGRAM);
      const config: RunOptions = {
        relocate: true,
        relocateOffset: 0,
      };
      runner.run(config);
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
      const runner = new CairoRunner(FIBONACCI_PROGRAM);
      const config: RunOptions = {
        relocate: false,
        relocateOffset: 1,
      };
      runner.run(config);
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
      const runner = new CairoRunner(FIBONACCI_PROGRAM);
      const config: RunOptions = {
        relocate: false,
        relocateOffset: 1,
      };
      runner.run(config);
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

  describe('builtins', () => {
    describe('bitwise', () => {
      test('should compute bitwise 12 & 10', () => {
        const runner = new CairoRunner(BITWISE_PROGRAM);
        const config: RunOptions = {
          relocate: true,
          relocateOffset: 1,
        };
        runner.run(config);
        const executionSize = runner.vm.memory.getSegmentSize(1);
        const executionEnd = runner.executionBase.add(executionSize);
        expect(runner.vm.memory.get(executionEnd.sub(2))).toEqual(new Felt(8n));
      });
    });

    describe('ec_op', () => {
      test('should properly compute  R = P + 34Q', () => {
        const runner = new CairoRunner(EC_OP_PROGRAM);
        const config: RunOptions = {
          relocate: true,
          relocateOffset: 1,
        };
        runner.run(config);

        const expectedRx = new Felt(
          108925483682366235368969256555281508851459278989259552980345066351008608800n
        );
        const expectedRy = new Felt(
          1592365885972480102953613056006596671718206128324372995731808913669237079419n
        );

        const executionSize = runner.vm.memory.getSegmentSize(1);
        const executionEnd = runner.executionBase.add(executionSize);
        expect(runner.vm.memory.get(executionEnd.sub(3))).toEqual(expectedRx);
        expect(runner.vm.memory.get(executionEnd.sub(2))).toEqual(expectedRy);
      });
    });

    describe('pedersen', () => {
      test('should properly compute Pedersen hashes of (0, 0), (0, 1), (1, 0) and (54, 1249832432) tuples', () => {
        const runner = new CairoRunner(PEDERSEN_PROGRAM);
        const config: RunOptions = {
          relocate: true,
          relocateOffset: 1,
        };
        runner.run(config);

        const expectedHashes = [
          0x49ee3eba8c1600700ee1b87eb599f16716b0b1022947733551fde4050ca6804n,
          0x46c9aeb066cc2f41c7124af30514f9e607137fbac950524f5fdace5788f9d43n,
          0x268a9d47dde48af4b6e2c33932ed1c13adec25555abaa837c376af4ea2f8a94n,
          0x20120a7d08fd21654c72a9281841406543b16d00faaca1069332053c41c07b8n,
        ].map((value) => new Felt(value));

        const executionSize = runner.vm.memory.getSegmentSize(1);
        const executionEnd = runner.executionBase.add(executionSize);

        const cellsPerPedersen = 3;
        const start = expectedHashes.length * cellsPerPedersen - 1;

        expectedHashes.forEach((hash, index) =>
          expect(
            runner.vm.memory.get(
              executionEnd.sub(start - cellsPerPedersen * index)
            )
          ).toEqual(hash)
        );
      });
    });

    describe('poseidon', () => {
      test('should properly compute Poseidon states from initial states (1, 2, 3) and (13, 40, 36)', () => {
        const runner = new CairoRunner(POSEIDON_PROGRAM);
        const config: RunOptions = {
          relocate: true,
          relocateOffset: 1,
        };
        runner.run(config);

        const expectedStates = [
          [
            0xfa8c9b6742b6176139365833d001e30e932a9bf7456d009b1b174f36d558c5n,
            0x4f04deca4cb7f9f2bd16b1d25b817ca2d16fba2151e4252a2e2111cde08bfe6n,
            0x58dde0a2a785b395ee2dc7b60b79e9472ab826e9bb5383a8018b59772964892n,
          ].map((value) => new Felt(value)),
          [
            0x3314844f551d723c07039394d16ceabebb5178983820576d393ed4725465b2en,
            0x368530a53a48b47a14e8e4e5cc1e531ec1c7fd92a0480ac5143ad6dc5794627n,
            0x5885c5b4d797dbae20b78bbfbb6e5ba02cc0a21ae05a9cac3606a21805be2c9n,
          ].map((value) => new Felt(value)),
        ];

        const executionSize = runner.vm.memory.getSegmentSize(1);
        const executionEnd = runner.executionBase.add(executionSize);

        const cellsPerPoseidon = 6;
        const start = expectedStates.length * cellsPerPoseidon - 2;

        const getPoseidonState = (index: number) => {
          return [
            runner.vm.memory.get(
              executionEnd.sub(start - index * cellsPerPoseidon)
            ),
            runner.vm.memory.get(
              executionEnd.sub(start - index * cellsPerPoseidon - 1)
            ),
            runner.vm.memory.get(
              executionEnd.sub(start - index * cellsPerPoseidon - 2)
            ),
          ];
        };

        const poseidonStates = [getPoseidonState(0), getPoseidonState(1)];
        expect(poseidonStates).toEqual(expectedStates);
      });
    });
  });
});
