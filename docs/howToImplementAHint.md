# How to implement a hint

Here is a how-to, using the hint `GetSegmentArenaIndex` as an example:

## Find the signature

Find the signature of the hint in the
[Cairo compiler](https://github.com/starkware-libs/cairo/blob/b741c26c553fd9fa3246cee91fd5c637f225cdb9/crates/cairo-lang-casm/src/hints/mod.rs):
[GetSegmentArenaIndex](https://github.com/starkware-libs/cairo/blob/b741c26c553fd9fa3246cee91fd5c637f225cdb9/crates/cairo-lang-casm/src/hints/mod.rs#L203)

```rust
/// Retrieves the index of the given dict in the dict_infos segment.
GetSegmentArenaIndex { dict_end_ptr: ResOperand, dict_index: CellRef },
```

Here, `dict_end_ptr` is a `ResOp` while `dict_index` is a `CellRef`.

The definitions of `Cellref` and `ResOp` can be found in `hintParamSchema.ts`.
Hint arguments can only be one of these two types.

## Parsing

The Cairo VM takes the serialized compilation artifacts as input, we use Zod to
parse them. Each hint has its own parser object.

The GetSegmentArenaIndex hint can be found in a format similar to this one:

```json
"GetSegmentArenaIndex": {
  "dict_end_ptr": {
    "Deref": {
      "register": "FP",
      "offset": -3
    }
  },
  "dict_index": {
    "register": "FP",
    "offset": 0
  }
}
```

- Add `GetSegmentArenaIndex` to the `HintName` enum in `src/hints/hintName.ts`.
  It is used to identify the hint before executing it in a run. Hints are
  ordered in an ascending alphabetical order.

  ```typescript
  // hintName.ts
  export enum HintName {
    // ...
    GetSegmentArenaIndex = 'GetSegmentArenaIndex',
  }
  ```

- Create the file `src/hints/dict/getSegmentArenaIndex.ts`. Place the file in
  the appropriate sub-folder category, here `dict` because the hint is dedicated
  to dictionnaries.

- Create and export a Zod object `getSegmentArenaIndexParser` which follows the
  hint signature:

  ```typescript
  // getSegmentArenaIndex.ts
  export const getSegmentArenaIndexParser = z
    .object({
      GetSegmentArenaIndex: z.object({
        dict_end_ptr: resOp,
        dict_index: cellRef,
      }),
    })
    .transform(({ GetSegmentArenaIndex: { dict_end_ptr, dict_index } }) => ({
      type: HintName.GetSegmentArenaIndex,
      dictEndPtr: dict_end_ptr,
      dictIndex: dict_index,
    }));
  ```

  The parsed object must be transformed in two ways:

  1. Enforce camelCase in fields name
  2. Add a field `type` which takes the corresponding value of the `HintName`
     enum.

- Add the parser to the Zod union `hint` in `src/hints/hintSchema.ts`:

  ```typescript
  // hintSchema.ts
  const hint = z.union([
    // ...
    getSegmentArenaIndexParser,
  ]);
  ```

Now, we can implement the core logic of the hint.

## Core Logic

The core logic of the hint will be implemented in the same file as the hint
parser, here `getSegmentArenaIndex.ts`. The function implementing this logic
must be named as the camelCase version of the hint: `getSegmentArenaIndex()`
(similar to its filename).

The parameters of the function are the virtual machine, as the hint must
interact with it, and the signature of the hint.

So, in our case, the function signature would be
`export getSegmentArenaIndex(vm: VirtualMachine, dictEndPtr: ResOp, dictIndex: CellRef)`

To implement the logic, refer yourself to its implementation in the
[`cairo-vm`](https://github.com/lambdaclass/cairo-vm/blob/24c2349cc19832fd8c1552304fe0439765ed82c6/vm/src/hint_processor/cairo_1_hint_processor/hint_processor.rs#L427-L444)
and the
[`cairo-lang-runner`](https://github.com/starkware-libs/cairo/blob/b741c26c553fd9fa3246cee91fd5c637f225cdb9/crates/cairo-lang-runner/src/casm_run/mod.rs#L1873-L1880)
from the Cairo compiler.

The last step is adding the hint to the handler object.

## Handler

The handler is defined in `src/hints/hintHandler.ts`

It is a dictionnary which maps a `HintName` value to a function executing the
corresponding core logic function.

```typescript
export const handlers: Record<
  HintName,
  (vm: VirtualMachine, hint: Hint) => void
> = {
  [HintName.GetSegmentArenaIndex]: (vm, hint) => {
    const h = hint as GetSegmentArenaIndex;
    getSegmentArenaIndex(vm, h.dictEndptr, h.dictIndex);
  },
};
```

- Set the key as the HintName value, `HintName.GetSegmentArenaIndex`
- Set the value to a function which takes `(vm, hint)` as parameters and execute
  the core logic function of the corresponding hint.

To do so, we make a type assertion of the hint, matching the `HintName` value,
and we call the corresponding core logic function with the appropriate
arguments.

The hint has been implemented, the last thing to do is testing it.

## Testing

Unit tests must test the correct parsing of the hint and the execution of the
core logic. Those tests are done in a `.test.ts` file in the same folder as the
hint. In our example, it would be `src/hints/dict/getSegmentArenaIndex.test.ts`.

Integration test is done by creating a Cairo program in
`cairo_programs/cairo/hints`. We must verify its proper execution by compiling
it with `make compile` and executing it with the command
`cairo run path/to/my_program.json`
