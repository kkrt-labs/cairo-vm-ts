import { z } from 'zod';

import { Felt } from 'primitives/felt';

const ApTrackingData = z.object({
  group: z.number(),
  offset: z.number(),
});

const Reference = z.object({
  ap_tracking_data: ApTrackingData,
  pc: z.number(),
  value: z.string(),
});

const ReferenceManager = z.object({
  references: z.array(Reference),
});

const Identifier = z.object({
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

const FlowTrackingData = z.object({
  ap_tracking: ApTrackingData,
  reference_ids: z.record(z.string(), z.number()),
});

const Hint = z.object({
  accessible_scopes: z.array(z.string()),
  code: z.string(),
  flow_tracking_data: FlowTrackingData,
});

const Program = z.object({
  attributes: z.any(),
  builtins: z.array(z.string()),
  compiler_version: z.string(),
  data: z
    .array(z.string())
    .transform((value) => value.map((v) => new Felt(BigInt(v)))),
  debug_info: z.any(), // TODO: DebugInfo
  hints: z.record(z.string(), z.array(Hint)),
  identifiers: z
    .record(z.string(), Identifier)
    .transform((record) => new Map<string, Identifier>(Object.entries(record))),
  main_scope: z.string(),
  prime: z.string(),
  reference_manager: ReferenceManager,
});

type ReferenceManager = z.infer<typeof ReferenceManager>;
export type ApTrackingData = z.infer<typeof ApTrackingData>;
export type Identifier = z.infer<typeof Identifier>;
export type FlowTrackingData = z.infer<typeof FlowTrackingData>;
export type Hint = z.infer<typeof Hint>;
export type Program = z.infer<typeof Program>;

export function parseProgram(program: string): Program {
  return Program.parse(JSON.parse(program));
}
