export class PrimitiveError extends Error {}

// Felt and Relocatable errors

/** Forbidden operation */
export class ForbiddenOperation extends PrimitiveError {}
/** Offset underflow */
export class OffsetUnderflow extends PrimitiveError {}
/** Segment error */
export class SegmentError extends PrimitiveError {}
