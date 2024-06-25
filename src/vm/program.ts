import { z } from 'zod';

import { ExpectedFelt } from 'errors/primitives';
import { InvalidIdentifierDest, UnknownIdentifier } from 'errors/program';

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

const Identifiers = z.record(z.string(), Identifier);

const FlowTrackingData = z.object({
  ap_tracking: ApTrackingData,
  reference_ids: z.record(z.string(), z.number()),
});

const Hint = z.object({
  accessible_scopes: z.array(z.string()),
  code: z.string(),
  flow_tracking_data: FlowTrackingData,
});

const Hints = z.record(z.string(), z.array(Hint));

const Program = z.object({
  attributes: z.any(),
  builtins: z.array(z.string()),
  compiler_version: z.string(),
  data: z
    .array(z.string())
    .transform((values) => values.map((v) => new Felt(BigInt(v)))),
  debug_info: z.any(), // TODO: DebugInfo
  hints: Hints,
  identifiers: Identifiers,
  main_scope: z.string(),
  prime: z.string(),
  reference_manager: ReferenceManager,
});

export type ReferenceManager = z.infer<typeof ReferenceManager>;
export type Reference = z.infer<typeof Reference>;
export type ApTrackingData = z.infer<typeof ApTrackingData>;
export type Identifier = z.infer<typeof Identifier>;
export type Identifiers = z.infer<typeof Identifiers>;
export type FlowTrackingData = z.infer<typeof FlowTrackingData>;
export type Hint = z.infer<typeof Hint>;
export type Hints = z.infer<typeof Hints>;
export type Program = z.infer<typeof Program>;
export class ProgramConstants extends Map<string, Felt> {
  constructor(values: Array<[string, Felt]> = []) {
    super(values);
  }
}

export function parseProgram(program: string): Program {
  return Program.parse(JSON.parse(program));
}

export function extractConstants(program: Program): ProgramConstants {
  const constants: ProgramConstants = new ProgramConstants();
  Object.entries(program.identifiers).map(([name, identifier]) => {
    switch (identifier.type) {
      case 'const':
        const value = identifier.value;
        if (!value) throw new ExpectedFelt(value);
        constants.set(name, value);
        break;
      case 'alias':
        const originalConst = findConstFromAlias(
          identifier.destination,
          program.identifiers
        );
        if (originalConst) {
          constants.set(name, originalConst);
        }
        break;
      default:
        break;
    }
  });
  return constants;
}

function findConstFromAlias(
  dest: string | undefined,
  identifiers: Identifiers
) {
  if (!dest) throw new InvalidIdentifierDest(dest);
  const identifier = identifiers[dest];
  if (!identifier) throw new UnknownIdentifier(dest);
  switch (identifier.type) {
    case 'const':
      return identifier.value;
    case 'alias':
      return findConstFromAlias(identifier.destination, identifiers);
    default:
      return undefined;
  }
}
