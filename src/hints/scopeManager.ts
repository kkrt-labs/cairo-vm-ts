import { CannotExitMainScope, VariableNotInScope } from 'errors/scopeManager';

export type Scope = {
  [key: string]: any;
};

export class ScopeManager {
  public data: Scope[];

  constructor() {
    this.data = [{}];
  }

  enterScope(newScope: Scope) {
    this.data.push(newScope);
  }

  exitScope() {
    if (this.data.length === 1) throw new CannotExitMainScope();
    this.data.pop();
  }

  get(name: string) {
    const variable = this.data[this.data.length - 1][name];
    if (variable === undefined) throw new VariableNotInScope(name);
    return variable;
  }

  set(name: string, value: any) {
    this.data[this.data.length - 1][name] = value;
  }

  delete(name: string) {
    const scope = this.data[this.data.length - 1];
    delete scope[name];
  }
}
