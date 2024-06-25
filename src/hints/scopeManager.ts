import { CannotExitMainScope, VariableNotInScope } from 'errors/scopeManager';

/**
 * A dictionnary mapping a variable name to its value,
 * which can be anything
 */
export type Scope = {
  [key: string]: any;
};

/**
 * A stack of Scope
 * Scopes are used to share variables across hints
 * Only the latest scope is available
 * There is always one scope in the stack, the main scope
 */
export class ScopeManager {
  public data: Scope[];

  constructor() {
    this.data = [{}];
  }

  /** Add a new scope to the stack */
  enterScope(newScope: Scope) {
    this.data.push(newScope);
  }

  /** Pop the stack */
  exitScope() {
    if (this.data.length === 1) throw new CannotExitMainScope();
    this.data.pop();
  }

  /** Return the value of variable `name` in the latest scope */
  get(name: string) {
    const variable = this.data[this.data.length - 1][name];
    if (variable === undefined) throw new VariableNotInScope(name);
    return variable;
  }

  /** Set the variable `name` to `value` in the latest scope */
  set(name: string, value: any) {
    this.data[this.data.length - 1][name] = value;
  }

  /** Delete the variable `name` from the latest scope */
  delete(name: string) {
    const scope = this.data[this.data.length - 1];
    delete scope[name];
  }
}
