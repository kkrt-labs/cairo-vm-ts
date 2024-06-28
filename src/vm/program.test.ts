import { describe, expect, test } from 'bun:test';
import * as fs from 'fs';

import { Felt } from 'primitives/felt';
import { parseCairo1Program, parseProgram } from './program';

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
        'cairo_programs/cairo/ecdsa_recover.casm.json',
        'utf8'
      );
      const programJson = JSON.parse(programContent);
      const bytecode = programJson.bytecode.map((element: string) => {
        return new Felt(BigInt(element));
      });

      const hints = new Map<number, any[]>(programJson.hints);

      const program = parseCairo1Program(programContent);
      expect(program.bytecode).toEqual(bytecode);
      expect(program.hints).toEqual(hints);
      expect(program.entrypoint).toEqual(programJson.entrypoint);
      expect(program.builtins).toEqual(programJson.builtins);
    });
  });
});
