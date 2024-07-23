# Cairo VM Typescript

<div align="center">
  <h1><code>Cairo VM TypeScript</code></h1>

<strong>An implementation of the Cairo VM in TypeScript, focusing on
education</strong>

[Github](https://github.com/kkrt-labs/cairo-vm-ts) ·
[Telegram](https://t.me/cairovmts)

<sub>Built with 🥕 by <a href="https://twitter.com/KakarotZkEvm">KKRT
Labs</a></sub>

</div>

> ⚠️ This project is in its genesis, undergoing fast-paced development. It is
> not suitable for production yet. Expect frequent breaking changes.

## What is Cairo

Cairo stands for CPU AIR "o" (like insp"o", conv"o", 🤔).

It is a framework (a machine, an assembly and a language) which allows writing
provable programs without having to understand the underneath ZK-technology.

A program written in Cairo (or Cairo Zero) is compiled to Cairo Assembly (CASM)
and then executed on a Cairo VM which produces traces to be used for the STARK
proof generation.

See [resources](#resources) for more information.

## Why this

### Implementation Diversity

There are currently seven other Cairo VM implementations:

- Reference (original)
  [implementation in Python](https://github.com/starkware-libs/cairo-lang) by
  Starkware (prod)
- New [implementation in Rust](https://github.com/lambdaclass/cairo-vm) by
  Lambda Class (prod)
- A [Go implementation](https://github.com/lambdaclass/cairo-vm_in_go), by
  Lambda Class (dev)
- Another [Go implementation](https://github.com/NethermindEth/cairo-vm-go) by
  Nethermind (dev)
- A
  [Zig implementation](https://github.com/keep-starknet-strange/ziggy-starkdust),
  by Community (dev)
- A [C++ implementation](https://github.com/lambdaclass/cairo-vm.c) by Lambda
  Class (dev)
- A
  [GoogleSheets (gs AppScript) implementation](https://github.com/ClementWalter/cairo-vm-gs)
  by Clément Walter (dev)

The Lambda Class alt-implementations comes with a detailed guide
([Go](https://github.com/lambdaclass/cairo-vm_in_go/blob/main/README.md#documentation),
[C++](https://github.com/lambdaclass/cairo-vm.c?tab=readme-ov-file#documentation))
on how they built their Cairo VM. It gives insights into the overall Cairo VM
but is incomplete and rather specific to language details.

Why would you have different implementations of the same program in multiple
languages? For **implementation diversity**.

More implementations provide more:

- **Resilience**. It helps in finding bugs in the existing   implementations.
- **Documentation**. The documentation over the Cairo VM is   still scarce, and
  the latest version in prod (Rust) is not easy to read for   the average dev.
- **Architecture diversity**. Different architectures can be   implemented to
  achieve the same goal (e.g. memory model). However, most of the current
  implementations essentially are a rewrite of the Rust implementation, which is
  an (enhanced) rewrite of the Python implementation itself.

Implementation diversity also implies **usage diversity**. The primary goals of
each implementation can differ.

For example, the EVM implementation in clients (e.g.
[geth](https://geth.ethereum.org/) and
[reth](https://github.com/paradigmxyz/reth) written in Go and Rust), whose
primary goals are **performance** and **safety**, and the
[reference EVM implementation](https://github.com/ethereum/execution-specs/?tab=readme-ov-file#execution-specification-work-in-progress)
in Python, prioritizing **readability** and **simplicity**.

Analogous to the EVM implementations, the primary goals of the Rust Cairo VM are
performance and safety. While the ones of our TypeScript implementation is
**education** through **readability** and **simplicity**.

### Demistifying the Cairo VM

- TypeScript is easily readable and known by most devs if not all
- Deliberate design choices to further improve readability and simplicity
- Extensive documentation: JSDoc, diagrams, explainers, etc.

## Local Development

### Requirements

- Install [Bun](https://bun.sh/)
- Install [Poetry](https://python-poetry.org/docs/#installation) to compile
  Cairo Programs

```bash
bun install # install all dependencies
bun test # run all tests
```

## Usage

### CLI

You can install the CLI `cairo-vm-ts` by doing the following:

1. Clone this repo: `git clone git@github.com:kkrt-labs/cairo-vm-ts.git`
2. Go to the cloned directory: `cd cairo-vm-ts`
3. Install the dependencies: `bun install`
4. Register the package as a _linkable_ package: `bun link`

Steps 3. and 4. can be replaced by `make build`

Example usage:

```bash
cairo run fibonacci.json --export-memory fib_mem.bin --print-memory --print-output
```

### As a dependency

No package release has been done yet.

You can still add it as a dependency with a local copy:

1. Clone this repo: `git clone git@github.com:kkrt-labs/cairo-vm-ts.git`
2. Go to the cloned directory: `cd cairo-vm-ts`
3. Install the dependencies: `bun install`
4. Build the project: `bun run build`
5. Go to your project `cd ~/my-project`
6. Add `cairo-vm-ts` to your project dependency:
   `<bun | yarn | npm> add ~/path/to/cairo-vm-ts`

## State of the VM

| Goals                        | Done?   |
| ---------------------------- | ------- |
| Run basic Cairo Zero program | &#9745; |
| Run basic Cairo program      | &#9745; |
| Add [builtins](#builtins)    | &#9745; |
| Add [hints](#hints)          | &#9744; |
| Run StarkNet contracts       | &#9744; |
| Benchmark against other VMs  | &#9744; |

<!-- TODO: Add the state of each section of the VM and a small explainer of their purpose (VM core, hints, builtins, runner...) -->

### Builtins

| Builtin                                                              | Done?   |
| -------------------------------------------------------------------- | ------- |
| [Output](https://github.com/kkrt-labs/cairo-vm-ts/issues/65)         | &#9745; |
| [Pedersen](https://github.com/kkrt-labs/cairo-vm-ts/issues/70)       | &#9745; |
| [Range Check](https://github.com/kkrt-labs/cairo-vm-ts/issues/68)    | &#9745; |
| [ECDSA](https://github.com/kkrt-labs/cairo-vm-ts/issues/67)          | &#9745; |
| [Bitwise](https://github.com/kkrt-labs/cairo-vm-ts/issues/62)        | &#9745; |
| [EcOp](https://github.com/kkrt-labs/cairo-vm-ts/issues/66)           | &#9745; |
| [Keccak](https://github.com/kkrt-labs/cairo-vm-ts/issues/69)         | &#9745; |
| [Poseidon](https://github.com/kkrt-labs/cairo-vm-ts/issues/71)       | &#9745; |
| [Range Check 96](https://github.com/kkrt-labs/cairo-vm-ts/issues/81) | &#9745; |
| [Segment Arena](https://github.com/kkrt-labs/cairo-vm-ts/pull/106)   | &#9745; |
| AddMod                                                               | &#9744; |
| MulMod                                                               | &#9744; |

### Hints

Hints are currently being implemented.

Their development can be tracked
[here](https://github.com/kkrt-labs/cairo-vm-ts/issues/90).

#### How to implement a hint ?

A how-to guide has been written [here](/src/hints/howToImplementAHint.md).

### Differential Testing & Benchmark

Pre-requisite: `make`

### Differential Testing

Compare the encoded memory and trace of execution between different Cairo VM
implementations on a broad range of Cairo programs.

It is currently only done in execution mode (non-proof mode) on programs with no
hints. It uses the CLI of each VM implementation.

| Cairo VM Implementations                                                     | Added to `diff-test` |
| ---------------------------------------------------------------------------- | -------------------- |
| [Cairo VM TS](https://github.com/kkrt-labs/cairo-vm-ts)                      | &#9745;              |
| [Cairo VM Rust](https://github.com/lambdaclass/cairo-vm)                     | &#9745;              |
| [Cairo VM Python](https://github.com/starkware-libs/cairo-lang)              | &#9745;              |
| [Cairo VM Zig](https://github.com/keep-starknet-strange/ziggy-starkdust)     | &#9745;              |
| [Cairo VM Go](https://github.com/NethermindEth/cairo-vm-go) - ProofMode only | &#9744;              |

#### Differential Testing Dependencies

To build the different projects CLI, you'll need the following dependencies:

- [Rust 1.74.1 or newer](https://www.rust-lang.org/tools/install)
- [Cargo](https://doc.rust-lang.org/cargo/getting-started/installation.html)
- [Zig](https://ziglang.org/)
- [Poetry](https://python-poetry.org/docs/#installation)

#### How to diff-test

To run the differential tests, simply use `make diff-test`.

If you wanna compare an arbitrary amount of memory or trace files, you can
directly use the `compare` command

```bash
compare memory fib.memory fib2.memory fib3.memory
compare trace fib.trace fib2.trace fib3.trace
```

### Benchmark

#### Benchmark Dependencies

[`hyperfine`](https://github.com/sharkdp/hyperfine)

#### Benchmark Details

For a quick benchmarking tool, one can run `make bench`

It uses `hyperfine` to benchmark the CLI command of the different Cairo VM
implementations. These benchmarks might not be accurate, it should be done in a
proper environment.

The benchmark programs used currently come from the
`cairo-vm/cairo_programs/benchmarks`. The workload of each program has been
reduced for slower implementations to finish () Only Cairo programs with no
hints are used at the moment:

| Cairo Program                | Description                                                                                                                                                                                                                                                                    | Value                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `big_factorial.cairo`        | Computes $n!$                                                                                                                                                                                                                                                                  | $n = 50000$                                                  |
| `big_fibonacci.cairo`        | Computes $u_n = u_{n-1} + u_{n-2}, n \geq 2, u_0 = 0, u_1 = 1$                                                                                                                                                                                                                 | $n = 40000$                                                  |
| `integration_builtins.cairo` | Computes $N$ times $\text{Pedersen}(a, u_{20})$. $\forall n \in \mathbb{N^*}, u_n = D(u_{n-1}, v_{n})$, $v_n = 3v_{n-1}$, $D(x, y) = (x \oplus y) \land (x \lor (y \gg 1))$. Verifies that $\forall n \in \mathbb{N}, v_n < 2^{64}$ and stores the value in the output segment | $N = 100$, $a = 123568$, $u_0 = 5673940$, $v_0 = 6783043740$ |
| `pedersen.cairo`             | Computes $N$ times $\text{Pedersen}(a, b)$                                                                                                                                                                                                                                     | $N = 5000$, $a = 123568$, $b = 5673940$                      |

A benchmark using each VM implementation API is developped at
[`cairo-vm-bench`](https://github.com/kkrt-labs/cairo-vm-bench)

## Resources

- [Cairo whitepaper](https://eprint.iacr.org/2021/1063)
- [Cairo Book](https://book.cairo-lang.org/)
- [Cairo website](https://www.cairo-lang.org/)

<!-- TODO: Add Project Guidelines -->

## Contributing Guidelines

- All commits must be
  [signed](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits)
  (PGP or SSH key, we recommend PGP keys)
- Issue assignment have a lifespan (e.g. 1d, 2d, 1w...), if no PR has been
  opened between assignment and expiry date, you'll be unassigned. Issues
  lifespan is introduced to avoid staling issues as the project moves quickly.
