#!/usr/bin/env node

import { OpenAI } from "openai";
import { ProofOfThoughtJS } from '../lib/proof-of-thought';
import { initializeZ3 } from '../lib/z3-helper';

// Fungsi untuk membaca question dari terminal
function readQuestionFromStdin(): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    let data = "";
    stdin.setEncoding("utf-8");

    stdin.on("data", chunk => {
      data += chunk;
    });

    stdin.on("end", () => {
      resolve(data.trim());
    });

    // Jika process.stdin sudah ditutup atau tidak ada data, juga resolve
    stdin.resume();
  });
}

// Executable main
async function main() {
  // Initialize Z3 module
  const z3Module = await initializeZ3();
  
  // Jika ada argumen di CLI setelah nama file, gunakan sebagai question
  const args = process.argv.slice(2);
  let question: string;
  if (args.length > 0) {
    question = args.join(" ");
  } else {
    console.log("Enter your question (end with Ctrl+D):");
    question = await readQuestionFromStdin();
  }

  console.log('Question:', question);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const pot = new ProofOfThoughtJS(openai);

  console.log('Calling pot.query...');
  const result = await pot.query(question, 3);
  console.log("Answer:", result.answer);
  if (result.sketch) {
    console.log("Sketch:", JSON.stringify(result.sketch, null, 2));
  }
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});