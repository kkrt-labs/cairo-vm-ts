import { describe, expect, test } from 'bun:test';
import * as fs from 'fs';

import { Felt } from 'primitives/felt';
import { parseProgram } from './program';

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

    test('parse program with hints', () => {
      const programContent = fs.readFileSync(
        'cairo_programs/cairo_0/ecdsa_builtin.json',
        'utf8'
      );
      const programJson = JSON.parse(programContent);
      const hints = programJson.hints;

      const program = parseProgram(programContent);
      expect(program.hints).toEqual(hints);
    });
  });
});
