import { z } from 'zod';

import { Felt } from 'primitives/felt';
import { hints } from 'hints/hintSchema';

const apTrackingData = z.object({
  group: z.number(),
  offset: z.number(),
});

const reference = z.object({
  ap_tracking_data: apTrackingData,
  pc: z.number(),
  value: z.string(),
});

const referenceManager = z.object({
  references: z.array(reference),
});

export type ReferenceManager = z.infer<typeof referenceManager>;

const identifier = z.object({
  full_name: z.string().optional(),
  members: z.record(z.string(), z.any()).optional(),
  size: z.number().optional(),
  decorators: z.array(z.string()).optional(),
  pc: z.number().optional(),
  type: z.string().optional(),
  cairo_type: z.string().optional(),
  value: z
    .number()
    .transform((value) => new Felt(BigInt(value)))
    .optional(),
  destination: z.string().optional(),
});

export type Identifier = z.infer<typeof identifier>;

const program = z.object({
  attributes: z.any(),
  builtins: z.array(z.string()),
  compiler_version: z.string(),
  data: z
    .array(z.string())
    .transform((value) => value.map((v) => new Felt(BigInt(v)))),
  debug_info: z.any(), // TODO: DebugInfo
  hints: z.record(z.string(), z.any()), // TODO: HintParams
  identifiers: z
    .record(z.string(), identifier)
    .transform((value) => new Map<string, Identifier>(Object.entries(value))),
  main_scope: z.string(),
  prime: z.string(),
  reference_manager: referenceManager,
});

export type Program = z.infer<typeof program>;

export function parseProgram(prgm: string): Program {
  return program.parse(JSON.parse(prgm));
}

const cairoProgram = z.object({
  prime: z.string(),
  compiler_version: z.string(),
  bytecode: z
    .array(z.string())
    .transform((value) => value.map((v) => new Felt(BigInt(v)))),
  hints,
  entrypoint: z.number(),
  builtins: z.array(z.string()),
});

type Program2 = z.infer<typeof cairoProgram>;

export type CairoProgram = Program2;

export function parseCairoProgram(program: string): CairoProgram {
  return cairoProgram.parse(JSON.parse(program));
}
