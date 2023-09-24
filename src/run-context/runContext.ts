import { Relocatable } from 'primitives/relocatable';

export class RunContext {
  private pc: Relocatable;
  private ap: Relocatable;
  private fp: Relocatable;

  constructor() {
    this.ap = new Relocatable(0, 0);
    this.pc = new Relocatable(0, 0);
    this.fp = new Relocatable(0, 0);
  }
}
