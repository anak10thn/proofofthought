import { Z3Helper } from './z3-helper';
import { DSL } from './dsl-types';

export class DSLInterpreter {
  private z3Helper: Z3Helper;
  private ctx: any;
  private solver: any;
  private vars: Record<string, any>;

  constructor(z3Module: any) {
    this.z3Helper = new Z3Helper(z3Module);
    this.ctx = this.z3Helper.createContext();
    this.solver = this.z3Helper.createSolver();
    this.vars = {};
  }

  parse(dsl: DSL) {
    // console.log('Parsing DSL:', JSON.stringify(dsl, null, 2));
    for (const v of dsl.vars) {
      this.vars[v] = this.z3Helper.createBoolConst(v);
      // console.log(`Created boolean constant ${v}:`, this.vars[v]);
    }

    for (const r of dsl.rules) {
      if (r.kind === "fact") {
        // console.log(`Adding fact: ${r.subject}`);
        if (r.subject) {
          this.solver.add(this.vars[r.subject]);
        }
      } else if (r.kind === "imply") {
        // Handle both formats: {subject, object} and {if, then}
        let subjVars: string[] = [];
        let objVar: string = "";
        
        if (r.if !== undefined && r.then !== undefined) {
          // LLM format: {if: [...], then: "..."}
          subjVars = Array.isArray(r.if) ? r.if : [r.if];
          objVar = r.then;
        } else if (r.subject !== undefined && r.object !== undefined) {
          // Original format: {subject: "...", object: "..."}
          subjVars = [r.subject];
          objVar = r.object;
        } else {
          // console.error('Invalid imply rule format:', r);
          continue;
        }
        
        const obj = this.vars[objVar];
        // console.log(`Creating implication: ${subjVars.join(' ∧ ')} -> ${objVar}`);
        // console.log(`Object expression:`, obj);
        
        // Create conjunction of all subject variables
        let conjSubj: any = null;
        if (subjVars.length > 0) {
          if (subjVars.length === 1) {
            conjSubj = this.vars[subjVars[0]];
          } else {
            // Use the helper method for multiple expressions
            const exprs = subjVars.map(subjVar => this.vars[subjVar]);
            conjSubj = this.z3Helper.createAnd(...exprs);
          }
        }
        
        if (conjSubj !== null) {
          const notSubj = this.z3Helper.createNot(conjSubj);
          const implication = this.z3Helper.createOr(
            notSubj,
            obj
          );
          // console.log(`Implication created:`, implication);
          this.solver.add(implication);
        }
      }
    }

    const queryVar = this.vars[dsl.query];
    // console.log(`Query variable ${dsl.query}:`, queryVar);
    return queryVar;
  }

  async checkQuery(queryVar: any): Promise<"yes" | "no" | "unknown"> {
    // Check if the query variable can be proven true
    this.solver.push();
    this.solver.add(queryVar);
    const result1 = await this.solver.check();
    this.solver.pop();
    
    // Check if the query variable can be proven false
    this.solver.push();
    this.solver.add(this.z3Helper.createNot(queryVar));
    const result2 = await this.solver.check();
    this.solver.pop();
    
    // Interpret results
    // In Z3:
    // - 'sat' means the constraints are satisfiable (consistent)
    // - 'unsat' means the constraints are unsatisfiable (inconsistent)
    // - 'unknown' means Z3 cannot determine
    
    // If assuming the query is true leads to satisfiability, 
    // and assuming the query is false leads to unsatisfiability,
    // then the query must be true
    if (result1 === 'sat' && result2 === 'unsat') {
      return "yes"; // Query is true
    } 
    // If assuming the query is true leads to unsatisfiability,
    // and assuming the query is false leads to satisfiability,
    // then the query must be false
    else if (result1 === 'unsat' && result2 === 'sat') {
      return "no"; // Query is false
    } 
    // Otherwise, we cannot determine (either both satisfiable or both unsatisfiable)
    else {
      return "unknown"; // Cannot determine
    }
  }
}