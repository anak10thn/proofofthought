import { init } from "z3-solver";

let z3Module: any = null;

export class Z3Helper {
  private ctx: any;

  constructor(z3Module: any) {
    // Use the high-level API through Context
    // Based on Z3 documentation, we need to properly initialize the context
    this.ctx = z3Module.Context('main');
    //console.log('Context created:', this.ctx);
  }

  createContext() {
    return this.ctx;
  }

  createSolver() {
    // Create a solver using the high-level API
    return new this.ctx.Solver();
  }

  createBoolConst(name: string) {
    // Create a boolean constant using the high-level API
    return this.ctx.Bool.const(name);
  }

  createNot(expr: any) {
    return this.ctx.Not(expr);
  }

  createOr(...exprs: any[]) {
    // For multiple expressions, we need to pass them as separate arguments
    return this.ctx.Or(...exprs);
  }

  createAnd(...exprs: any[]) {
    // For multiple expressions, we need to pass them as separate arguments
    return this.ctx.And(...exprs);
  }
}

export async function initializeZ3() {
  if (!z3Module) {
    z3Module = await init();
  }
  return z3Module;
}