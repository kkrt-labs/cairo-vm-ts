// Instruction is the representation of the first word of each Cairo instruction.
// Some instructions spread over two words when they use an immediate value, so
// representing the first one with this struct is enougth.

//  Structure of the 63-bit that form the first word of each instruction.
//  See Cairo whitepaper, page 32 - https://eprint.iacr.org/2021/1063.pdf.
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                     off_dst (biased representation)                     │
// ├─────────────────────────────────────────────────────────────────────────┤
// │                     off_op0 (biased representation)                     │
// ├─────────────────────────────────────────────────────────────────────────┤
// │                     off_op1 (biased representation)                     │
// ├─────┬─────┬───────┬───────┬───────────┬────────┬───────────────────┬────┤
// │ dst │ op0 │  op1  │  res  │    pc     │   ap   │      opcode       │ 0  │
// │ reg │ reg │  src  │ logic │  update   │ update │                   │    │
// ├─────┼─────┼───┬───┼───┬───┼───┬───┬───┼───┬────┼────┬────┬────┬────┼────┤
// │  0  │  1  │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │ 9 │ 10 │ 11 │ 12 │ 13 │ 14 │ 15 │
// └─────┴─────┴───┴───┴───┴───┴───┴───┴───┴───┴────┴────┴────┴────┴────┴────┘
// Source: https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/instruction.go

// Dst & Op0 register flags
// If the flag == 0, then the offset will point to Ap
type ApRegisterFlag = 0;
// If the flag == 1, then the offset will point to Fp
type FpRegisterFlag = 1;
type RegisterFlag = ApRegisterFlag | FpRegisterFlag;
type DstRegister = RegisterFlag;
type Op0Register = RegisterFlag;

// Op1Src
type Op1Src = 0 | 1 | 2 | 4;

// ResLogic
type ResLogic = 0 | 1 | 2 | 3;

// Pc Update
enum PcUpdate {
  PcUpdateRegular = 0,
  PcUpdateJump = 1,
  PcUpdateJumpRel = 2,
  PcUpdateJnz = 3,
}

// Ap update
enum ApUpdate {
  ApUpdateRegular = 0,
  ApUpdateAdd = 1,
  AppUpdateAdd1 = 2,
  AppUpdateAdd2 = 3,
}

// Fp Update
enum FpUpdate {
  FpUpdateRegular = 0,
  FpUpdateApPlus2 = 1,
  FpUpdateDst = 2,
}

enum Opcode {
  NoOp = 0,
  AssertEq = 1,
  Call = 2,
  Ret = 4,
}

export type Instruction = {};
