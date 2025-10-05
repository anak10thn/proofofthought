#!/usr/bin/env node

import { DSLInterpreter } from '../lib/dsl-interpreter';
import { initializeZ3 } from '../lib/z3-helper';
import { DSL } from '../lib/dsl-types';

async function debugTest() {
  console.log('Debugging DSL interpreter...');
  
  try {
    const z3 = await initializeZ3();
    const interpreter = new DSLInterpreter(z3);
    
    // Simple test: a is true, what is a?
    const dsl: DSL = {
      vars: ['a'],
      rules: [
        { kind: "fact", subject: "a", value: true }
      ],
      query: "a"
    };
    
    console.log('\nDebug Test: Simple fact');
    console.log('DSL:', JSON.stringify(dsl, null, 2));
    
    // Let's manually check what happens
    const z3Helper = new (await import('../lib/z3-helper')).Z3Helper(z3);
    const ctx = z3Helper.createContext();
    const solver = z3Helper.createSolver();
    const vars: Record<string, any> = {};
    
    // Create variables
    for (const v of dsl.vars) {
      vars[v] = z3Helper.createBoolConst(v);
      console.log(`Created boolean constant ${v}`);
    }
    
    // Add facts
    for (const r of dsl.rules) {
      if (r.kind === "fact" && r.subject) {
        if (r.value === false) {
          console.log(`Adding negation: not ${r.subject}`);
          solver.add(z3Helper.createNot(vars[r.subject]));
        } else {
          console.log(`Adding fact: ${r.subject}`);
          solver.add(vars[r.subject]);
        }
      }
    }
    
    const queryVar = vars[dsl.query];
    console.log(`Query variable: ${dsl.query}`);
    
    // Check if query can be proven true
    solver.push();
    solver.add(queryVar);
    const result1 = await solver.check();
    solver.pop();
    console.log(`Result when assuming ${dsl.query} is true: ${result1}`);
    
    // Check if query can be proven false
    solver.push();
    solver.add(z3Helper.createNot(queryVar));
    const result2 = await solver.check();
    solver.pop();
    console.log(`Result when assuming ${dsl.query} is false: ${result2}`);
    
    // Full test with interpreter
    console.log('\n--- Using Interpreter ---');
    const queryVarInterp = interpreter.parse(dsl);
    const resultInterp = await interpreter.checkQuery(queryVarInterp);
    console.log('Interpreter result:', resultInterp);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugTest();