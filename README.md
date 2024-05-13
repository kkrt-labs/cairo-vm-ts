# TypeScript Cairo VM

<div align="center">
  <h1><code>TypeScript Cairo VM</code></h1>

<strong>An implementation of the Cairo VM in TypeScript, focusing on
education</strong>

[Github](https://github.com/kkrt-labs/cairo-vm-ts)

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
each implementation can differ. For example, the EVM implementation in clients
(e.g. geth and reth written in Go and Rust), whose primary goals are
**performance** and **safety**, and the
[reference EVM implementation](https://github.com/ethereum/execution-specs/?tab=readme-ov-file#execution-specification-work-in-progress)
in Python, prioritizing **readability** and **simplicity**.

Analogous to the EVM implementations, the primary goals of the Rust Cairo VM are
performance and safety. While the ones of our TypeScript implementation is
**education** through **readability** and **simplicity**.

### Demistifying the Cairo VM

- TypeScript is easily readable and known by most devs if not all
- Deliberate design choices to further improve readability and simplicity
- Extensive documentation: JSDoc, diagrams, explainers, etc.

## State of the VM

| Goals                        | Done?   |
| ---------------------------- | ------- |
| Run basic Cairo Zero program | &#9745; |
| Run basic Cairo program      | &#9744; |
| Add [builtins](#builtins)    | &#9744; |
| Add [hints](#hints)          | &#9744; |
| Run StarkNet contracts       | &#9744; |
| Benchmark against other VMs  | &#9744; |

<!-- TODO: Add the state of each section of the VM and a small explainer of their purpose (VM core, hints, builtins, runner...) -->

### Builtins

<!-- Add a table with the builtin list and state done/to be done -->

### Hints

<!-- Add a table with the hint list and state done/to be done -->
<!-- If the list is too long, maybe separate in chunks, put the list in an issue to track it and reference the issue here -->

<!-- TODO: Add a Benchmark section when process is nailed -->

## Resources

- [Cairo whitepaper](https://eprint.iacr.org/2021/1063)
- [Cairo Book](https://book.cairo-lang.org/)
- [Cairo website](https://www.cairo-lang.org/)

## Local Development

### Requirements

- Install [bun](https://bun.sh/)
- Run `bun install` to install all dependencies
- Run `bun test` to run all tests

<!-- TODO: Add Project Guidelines -->
