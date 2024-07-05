import { describe, expect, test } from 'bun:test';
import * as fs from 'fs';

import { Felt } from 'primitives/felt';
import { parseCairoProgram, parseProgram } from './program';
import { Hint, HintName, OpType } from 'hints/hintSchema';
import { Register } from './instruction';

describe('program', () => {
  describe('parseProgram', () => {
    test('should correctly parse the program data', () => {
      const programContent = fs.readFileSync(
        'cairo_programs/cairo_0/fibonacci.json',
        'utf8'
      );
      const programJson = JSON.parse(programContent);
      const data = programJson.data.map((element: string) => {
        return new Felt(BigInt(element));
      });

      const program = parseProgram(programContent);
      expect(program.data).toEqual(data);
    });
  });

  describe('parseCairo1Program', () => {
    test('should correctly parse the program', () => {
      const programContent = fs.readFileSync(
        'cairo_programs/cairo/hints/test_less_than.casm.json',
        'utf8'
      );
      const programJson = JSON.parse(programContent);
      const bytecode = programJson.bytecode.map((element: string) => {
        return new Felt(BigInt(element));
      });

      const hints = new Map<number, Hint[]>();
      hints.set(5, [
        {
          type: HintName.TestLessThan,
          lhs: {
            type: OpType.Deref,
            cell: {
              register: Register.Ap,
              offset: 0,
            },
          },
          rhs: {
            type: OpType.Immediate,
            value: new Felt(BigInt('0x100000000')),
          },
          dst: {
            register: Register.Ap,
            offset: -1,
          },
        },
      ]);

      const program = parseCairoProgram(programContent);
      expect(program.bytecode).toEqual(bytecode);
      expect(program.hints).toEqual(hints);
      expect(program.entrypoint).toEqual(programJson.entrypoint);
      expect(program.builtins).toEqual(programJson.builtins);
    });
  });
});
