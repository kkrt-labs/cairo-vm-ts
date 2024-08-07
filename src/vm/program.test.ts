import { describe, expect, test } from 'bun:test';

import * as fs from 'fs';

import { Felt } from 'primitives/felt';

import { Hint } from 'hints/hintSchema';
import { HintName } from 'hints/hintName';
import { Register } from './instruction';
import { parseCairoProgram, parseCairoZeroProgram } from './program';

describe('program', () => {
  describe('parseCairoZeroProgram', () => {
    test('should correctly parse the program data', () => {
      const programContent = fs.readFileSync(
        'cairo_programs/cairo_0/fibonacci.json',
        'utf8'
      );
      const programJson = JSON.parse(programContent);
      const data = programJson.data.map((element: string) => {
        return new Felt(BigInt(element));
      });

      const program = parseCairoZeroProgram(programContent);
      expect(program.data).toEqual(data);
    });
  });

  describe('parseCairoProgram', () => {
    test('should correctly parse the program', () => {
      const programContent = fs.readFileSync(
        'cairo_programs/cairo/hints/array_append.json',
        'utf8'
      );
      const programJson = JSON.parse(programContent);
      const bytecode = programJson.bytecode.map((element: string) => {
        return new Felt(BigInt(element));
      });

      const hints = new Map<number, Hint[]>();
      hints.set(0, [
        {
          type: HintName.AllocSegment,
          dst: { register: Register.Ap, offset: 0 },
        },
      ]);

      const program = parseCairoProgram(programContent);
      expect(program.bytecode).toEqual(bytecode);
      expect(program.hints).toEqual(hints);
      expect(program.entry_points_by_function).toEqual(
        programJson.entry_points_by_function
      );
    });
  });
});
