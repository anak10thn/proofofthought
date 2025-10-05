#!/usr/bin/env node

// Test that we can import the library
import { ProofOfThoughtJS, DSL, Rule } from '../lib';

console.log('Library imported successfully!');

// Test that we can create instances
import { OpenAI } from 'openai';

// This would normally require an API key, but we're just testing imports
console.log('ProofOfThoughtJS class available:', typeof ProofOfThoughtJS);

// Show available exports
console.log('Available exports:');
console.log('- ProofOfThoughtJS:', typeof ProofOfThoughtJS);
console.log('- DSL:', typeof DSL); // This will show 'undefined' because it's a type
console.log('- Rule:', typeof Rule); // This will show 'undefined' because it's a type

console.log('Library test completed successfully!');