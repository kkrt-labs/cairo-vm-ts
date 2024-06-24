import { describe, expect, test } from 'bun:test';
import * as fs from 'fs';

import { Felt } from 'primitives/felt';
import { Program, extractConstants, parseProgram } from './program';

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

  describe('extractConstant', () => {
    test('should properly extract constants', () => {
      const program: Program = {
        builtins: [],
        compiler_version: '',
        data: [],
        hints: {},
        main_scope: '',
        prime: '',
        reference_manager: { references: [] },
        attributes: [],
        identifiers: {
          start: {
            type: 'label',
            value: new Felt(2n),
          },
          end: {
            type: 'label',
            value: new Felt(6n),
          },
          constA: {
            type: 'const',
            value: new Felt(24n),
          },
          constB: {
            type: 'const',
            value: new Felt(13n),
          },
        },
      };

      const expectedConstants = new Map<string, Felt>([
        ['constA', new Felt(24n)],
        ['constB', new Felt(13n)],
      ]);

      expect(extractConstants(program)).toEqual(expectedConstants);
    });

    test('should properly extract constants with aliases', () => {
      const program: Program = {
        builtins: [],
        compiler_version: '',
        data: [],
        hints: {},
        main_scope: '',
        prime: '',
        reference_manager: { references: [] },
        attributes: [],
        identifiers: {
          'const.A': {
            type: 'const',
            value: new Felt(24n),
          },
          'label.B': {
            type: 'label',
            value: new Felt(13n),
          },
          'alias.label.B': {
            type: 'alias',
            destination: 'label.B',
          },
          'alias.const.A': {
            type: 'alias',
            destination: 'const.A',
          },
          'nested.alias.const.A': {
            type: 'alias',
            destination: 'alias.const.A',
          },
        },
      };

      const expectedConstants = new Map<string, Felt>([
        ['const.A', new Felt(24n)],
        ['alias.const.A', new Felt(24n)],
        ['nested.alias.const.A', new Felt(24n)],
      ]);

      expect(extractConstants(program)).toEqual(expectedConstants);
    });
  });
});
