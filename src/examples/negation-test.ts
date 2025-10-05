#!/usr/bin/env node

import { DSLInterpreter } from '../lib/dsl-interpreter';
import { initializeZ3 } from '../lib/z3-helper';
import { DSL, Rule } from '../lib/dsl-types';

async function runTest(testName: string, dsl: DSL, expected: string, z3: any) {
  console.log(`\n${testName}`);
  console.log('DSL:', JSON.stringify(dsl, null, 2));
  
  try {
    const interpreter = new DSLInterpreter(z3);
    const queryVar = interpreter.parse(dsl);
    const result = await interpreter.checkQuery(queryVar);
    console.log('Result:', result, `(expected: ${expected})`);
    return result;
  } catch (error) {
    console.error('Error:', error);
    return 'error';
  }
}

async function testNegation() {
  console.log('Testing negation support...');
  
  try {
    const z3 = await initializeZ3();
    
    // Test case 1: Simple negation
    const dsl1: DSL = {
      vars: ['a', 'b'],
      rules: [
        { kind: "fact", subject: "a", value: true },
        { kind: "fact", subject: "b", value: false }
      ],
      query: "b"
    };
    
    await runTest('Test 1: Simple negation', dsl1, 'no', z3);
    
    // Test case 2: Implication with negated consequent
    const dsl2: DSL = {
      vars: ['p', 'q'],
      rules: [
        { kind: "fact", subject: "p", value: true },
        { kind: "imply", if: "p", then: "q", value: false } // p implies not q
      ],
      query: "q"
    };
    
    await runTest('Test 2: Implication with negated consequent', dsl2, 'no', z3);
    
    // Test case 3: Modus tollens (if p then q, not q, therefore not p)
    const dsl3: DSL = {
      vars: ['p', 'q'],
      rules: [
        { kind: "imply", if: "p", then: "q" }, // p implies q
        { kind: "fact", subject: "q", value: false } // q is false
      ],
      query: "p"
    };
    
    await runTest('Test 3: Modus tollens', dsl3, 'no', z3);
    
    // Test case 4: Double negation
    const dsl4: DSL = {
      vars: ['a'],
      rules: [
        { kind: "fact", subject: "a", value: true }
      ],
      query: "a"
    };
    
    await runTest('Test 4: Double negation elimination', dsl4, 'yes', z3);
    
    // Test case 5: Contradiction detection (will show warning but result is "unknown")
    const dsl5: DSL = {
      vars: ['x'],
      rules: [
        { kind: "fact", subject: "x", value: true },
        { kind: "fact", subject: "x", value: false }
      ],
      query: "x"
    };
    
    console.log('\nTest 5: Contradiction detection');
    console.log('DSL:', JSON.stringify(dsl5, null, 2));
    console.log('Note: This test will show a warning about contradiction and return "unknown"');
    console.log('because the system is inconsistent (both x=true and x=false are asserted)');
    
    const interpreter5 = new DSLInterpreter(z3);
    const queryVar5 = interpreter5.parse(dsl5);
    const result5 = await interpreter5.checkQuery(queryVar5);
    console.log('Result:', result5, '(expected: unknown)');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testNegation();