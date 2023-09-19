import { Felt } from "./felt";
import { Relocatable } from "./relocatable";

export class NotImplementedError extends Error {}

export type MaybeRelocatable = Relocatable | Felt;
