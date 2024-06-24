class CairoRunnerError extends Error {}

export class EmptyRelocatedMemory extends CairoRunnerError {
  constructor() {
    super('The relocated memory is empty, cannot relocate');
  }
}
