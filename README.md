# Cairo VM in Typescript

## What is Cairo

<!-- TODO: fill this section -->

Cairo stands for CPU AIR "o" (like insp"o", conv"o", 🤔). See
[Cairo whitepaper](https://eprint.iacr.org/2021/1063) for more information.

## Why this

There are currently three Cairo VM implementations:

- the original
  [python implementation](https://github.com/starkware-libs/cairo-lang) by
  Starkware (prod)
- the new [rust implementation](https://github.com/lambdaclass/cairo-vm) by
  Lambda Class (prod)
- a new [go implementation](https://github.com/lambdaclass/cairo-vm_in_go) by
  Lambda Class (dev)

<!-- TODO: add some context about the need of client diversity -->

The Go implementation comes with an
[impressive documentation](https://github.com/lambdaclass/cairo-vm_in_go/blob/main/README.md#documentation)
regarding the how-to for a Cairo VM. This repo is coded with the flow while
reading it.

Read so far up to
[#Run Context](https://github.com/lambdaclass/cairo-vm_in_go/blob/main/README.md#runcontext)
