import { $ } from 'bun';
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

const KECCAK_SEED_PROGRAM_STRING = fs.readFileSync(
  'cairo_programs/cairo_0/keccak_builtin_seed.json',
  'utf8'
);

const KECCAK_PROGRAM_STRING = fs.readFileSync(
  'cairo_programs/cairo_0/keccak_builtin.json',
  'utf8'
);

const JMP_PROGRAM_STRING = fs.readFileSync(
  'cairo_programs/cairo_0/jmp.json',
  'utf8'
);

const BITWISE_OUTPUT_PROGRAM_STRING = fs.readFileSync(
  'cairo_programs/cairo_0/bitwise_output.json',
  'utf8'
);

const FIBONACCI_PROGRAM = parseProgram(FIBONACCI_PROGRAM_STRING);
const BITWISE_PROGRAM = parseProgram(BITWISE_PROGRAM_STRING);
const EC_OP_PROGRAM = parseProgram(EC_OP_PROGRAM_STRING);
const PEDERSEN_PROGRAM = parseProgram(PEDERSEN_PROGRAM_STRING);
const POSEIDON_PROGRAM = parseProgram(POSEIDON_PROGRAM_STRING);
const KECCAK_SEED_PROGRAM = parseProgram(KECCAK_SEED_PROGRAM_STRING);
const KECCAK_PROGRAM = parseProgram(KECCAK_PROGRAM_STRING);
const JMP_PROGRAM = parseProgram(JMP_PROGRAM_STRING);
const BITWISE_OUTPUT_PROGRAM = parseProgram(BITWISE_OUTPUT_PROGRAM_STRING);

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

    test('should compare memory from TS & Python VMs execution of fibonacci', async () => {
      const programPath = 'cairo_programs/cairo_0/fibonacci.json';
      const pyMemoryPath = path.join(tmpDir, 'memory_python.bin');
      await $`poetry run cairo-run --layout=starknet --program=${programPath} --memory_file ${pyMemoryPath}`;

      const runner = new CairoRunner(FIBONACCI_PROGRAM);
      const config: RunOptions = {
        relocate: false,
        relocateOffset: 1,
      };
      runner.run(config);
      const tsMemoryPath = path.join(tmpDir, 'memory_ts.bin');
      runner.exportMemory(tsMemoryPath);

      const tsMemory = fs.readFileSync(tsMemoryPath);
      const pyMemory = fs.readFileSync(pyMemoryPath);
      expect(tsMemory.equals(pyMemory)).toBeTrue;
    });

    test('should compare trace from TS & Python VMs execution of fibonacci', async () => {
      const programPath = 'cairo_programs/cairo_0/fibonacci.json';
      const pyTracePath = path.join(tmpDir, 'trace_python.bin');
      await $`poetry run cairo-run --layout=starknet --program=${programPath} --trace_file ${pyTracePath}`;

      const runner = new CairoRunner(FIBONACCI_PROGRAM);
      const config: RunOptions = {
        relocate: false,
        relocateOffset: 1,
      };
      runner.run(config);
      const tsTracePath = path.join(tmpDir, 'trace_ts.bin');
      runner.exportTrace(tsTracePath);

      const tsTrace = fs.readFileSync(tsTracePath);
      const pyTrace = fs.readFileSync(pyTracePath);
      expect(tsTrace.equals(pyTrace)).toBeTrue;
    });

    /*
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

    describe('keccak', () => {
      test('Should properly compute state from input state KeccakBuiltinState(0, 0, 0, 0, 0, 0, 0, 0)', () => {
        const runner = new CairoRunner(KECCAK_SEED_PROGRAM);
        const config: RunOptions = {
          relocate: true,
          relocateOffset: 1,
        };
        runner.run(config);

        const expectedState = [
          new Felt(0x4dd598261ea65aa9ee84d5ccf933c0478af1258f7940e1dde7n),
          new Felt(0x47c4ff97a42d7f8e6fd48b284e056253d057bd1547306f8049n),
          new Felt(0x8ffc64ad30a6f71b19059c8c5bda0cd6192e7690fee5a0a446n),
          new Felt(0xdbcf555fa9a6e6260d712103eb5aa93f2317d63530935ab7d0n),
          new Felt(0x5a21d9ae6101f22f1a11a5569f43b831cd0347c82681a57c16n),
          new Felt(0x5a554fd00ecb613670957bc4661164befef28cc970f205e563n),
          new Felt(0x41f924a2c509e4940c7922ae3a26148c3ee88a1ccf32c8b87cn),
          new Felt(0xeaf1ff7b5ceca24975f644e97f30a13b16f53526e70465c218n),
        ];

        const executionSize = runner.vm.memory.getSegmentSize(1);
        const executionEnd = runner.executionBase.add(executionSize);

        expectedState.forEach((value, index) =>
          expect(runner.vm.memory.get(executionEnd.sub(9 - index))).toEqual(
            value
          )
        );
      });

      test('Should properly compute state from input state KeccakBuiltinState(1, 2, 3, 4, 5, 6, 7, 8)', () => {
        const runner = new CairoRunner(KECCAK_PROGRAM);
        const config: RunOptions = {
          relocate: true,
          relocateOffset: 1,
        };
        runner.run(config);

        const expectedState = [
          new Felt(0x5437ca4807beb9df3871c8467f0c8c2ac42e1f2100e18198f6n),
          new Felt(0x7a753f70755cbbde7882962e5969b2874c2dff11a91716ab31n),
          new Felt(0xe561082c7d6621e7480f773a54870b0dab0ad6151b08ee303an),
          new Felt(0xb744cd390af9518a46a3d88b6003f7393c7ead3f9a131638ben),
          new Felt(0xf16079da5c848e9f6b99afdf72720169e5209e171f8ef7582en),
          new Felt(0xe108fbbcea9d86a6d76f01b63c33ffffd896ad8e2b71026060n),
          new Felt(0x9c7aa8a62187936713012ec096925a78b1c1a140ab7a061ca3n),
          new Felt(0xd5774bd1793a6b3940c0a54888a6a3c1e57251a7e727590b40n),
        ];

        const executionSize = runner.vm.memory.getSegmentSize(1);
        const executionEnd = runner.executionBase.add(executionSize);

        expectedState.forEach((value, index) =>
          expect(runner.vm.memory.get(executionEnd.sub(9 - index))).toEqual(
            value
          )
        );
      });
    });

    describe('output', () => {
      test('Should properly store the jmp dest value in the output segment', () => {
        const runner = new CairoRunner(JMP_PROGRAM);
        const config: RunOptions = {
          relocate: true,
          relocateOffset: 1,
        };
        runner.run(config);
        const output = runner.getOutput();
        expect(output.length).toEqual(1);
        expect(output[0]).toEqual(new Felt(2n));
      });

      test('Should properly write the result of bitwise 1 & 2 to output segment', () => {
        const runner = new CairoRunner(BITWISE_OUTPUT_PROGRAM);
        const config: RunOptions = {
          relocate: true,
          relocateOffset: 1,
        };
        runner.run(config);
        const output = runner.getOutput();
        expect(output.length).toEqual(1);
        expect(output[0]).toEqual(new Felt(0n));
      });
    });
  });
});
