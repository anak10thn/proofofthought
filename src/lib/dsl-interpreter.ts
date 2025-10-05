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

  /**
   * Detect direct contradictions in facts (e.g., A=true and A=false)
   */
  private detectContradictions(rules: any[]) {
    const factValues: Record<string, boolean[]> = {};

    // Collect all fact values
    for (const rule of rules) {
      if (rule.kind === "fact" && rule.subject) {
        const varName = rule.subject;
        const value = rule.value !== false; // default to true if not specified
        
        if (!factValues[varName]) {
          factValues[varName] = [];
        }
        factValues[varName].push(value);
      }
    }

    // Check for contradictions
    for (const [varName, values] of Object.entries(factValues)) {
      const hasTrue = values.includes(true);
      const hasFalse = values.includes(false);
      
      if (hasTrue && hasFalse) {
        console.warn(`Warning: Direct contradiction detected for variable '${varName}' (both true and false)`);
        // Note: We don't stop processing here, as Z3 can sometimes handle contradictions meaningfully
      }
    }
  }

  parse(dsl: DSL) {
    // console.log('Parsing DSL:', JSON.stringify(dsl, null, 2));
    for (const v of dsl.vars) {
      this.vars[v] = this.z3Helper.createBoolConst(v);
      // console.log(`Created boolean constant ${v}:`, this.vars[v]);
    }

    // Pre-process rules to detect direct contradictions
    this.detectContradictions(dsl.rules);

    // Helper function to ensure a variable exists
    const ensureVariable = (varName: string) => {
      if (!this.vars[varName]) {
        this.vars[varName] = this.z3Helper.createBoolConst(varName);
        // console.log(`Dynamically created boolean constant ${varName}:`, this.vars[varName]);
      }
    };

    for (const r of dsl.rules) {
      if (r.kind === "fact") {
        // console.log(`Adding fact: ${r.subject}`);
        if (r.subject) {
          // Ensure the variable exists
          ensureVariable(r.subject);
          
          // Handle negation with value field
          if (r.value === false) {
            // Add negation of the variable
            this.solver.add(this.z3Helper.createNot(this.vars[r.subject]));
          } else {
            // Default behavior (value is true or undefined)
            this.solver.add(this.vars[r.subject]);
          }
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
        
        // Ensure all variables exist
        subjVars.forEach(v => ensureVariable(v));
        ensureVariable(objVar);
        
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
          // Handle negation in the consequent
          let finalObj = obj;
          if (r.value === false) {
            // If the rule specifies value: false, negate the consequent
            finalObj = this.z3Helper.createNot(obj);
          }
          
          // Ensure both expressions are valid before creating implication
          if (conjSubj && finalObj) {
            const notSubj = this.z3Helper.createNot(conjSubj);
            const implication = this.z3Helper.createOr(
              notSubj,
              finalObj
            );
            // console.log(`Implication created:`, implication);
            this.solver.add(implication);
          } else {
            console.warn(`Warning: Skipping invalid implication rule:`, r);
          }
        }
      }
    }

    // Ensure the query variable exists
    if (!this.vars[dsl.query]) {
      this.vars[dsl.query] = this.z3Helper.createBoolConst(dsl.query);
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