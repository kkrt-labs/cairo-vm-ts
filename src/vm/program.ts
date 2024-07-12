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

const programBase = z.object({
  prime: z.string(),
  compiler_version: z.string(),
});

const cairoZeroProgram = programBase.extend({
  data: z
    .array(z.string())
    .transform((value) => value.map((v) => new Felt(BigInt(v)))),
  hints: z.record(z.string(), z.any()), // TODO: HintParams
  debug_info: z.any(), // TODO: DebugInfo
  builtins: z.array(z.string()),
  attributes: z.any(),
  identifiers: z
    .record(z.string(), identifier)
    .transform((value) => new Map<string, Identifier>(Object.entries(value))),
  main_scope: z.string(),
  reference_manager: referenceManager,
});

const cairoArg = z.object({
  generic_id: z.string(),
  size: z.number(),
  debug_name: z.string(),
});

const cairoOutputArg = cairoArg.extend({
  panic_inner_type: cairoArg.optional(),
});

const entrypoint = z.object({
  offset: z.number(),
  builtins: z.array(z.string()),
  input_args: z.array(cairoArg),
  return_arg: z.array(cairoOutputArg),
});

export type Entrypoint = z.infer<typeof entrypoint>;

const cairoProgram = programBase.extend({
  bytecode: z
    .array(z.string())
    .transform((value) => value.map((v) => new Felt(BigInt(v)))),
  hints,
  entry_points_by_function: z.record(z.string(), entrypoint),
});

export type CairoZeroProgram = z.infer<typeof cairoZeroProgram>;
export type CairoProgram = z.infer<typeof cairoProgram>;
export type Program = CairoZeroProgram | CairoProgram;

export function parseCairoZeroProgram(prgm: string): CairoZeroProgram {
  return cairoZeroProgram.parse(JSON.parse(prgm));
}

export function parseCairoProgram(program: string): CairoProgram {
  return cairoProgram.parse(JSON.parse(program));
}
