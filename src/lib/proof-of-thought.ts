import { OpenAI } from "openai";
import { DSL } from './dsl-types';
import { DSLInterpreter } from './dsl-interpreter';
import { initializeZ3 } from './z3-helper';

export class ProofOfThoughtJS {
  llm: OpenAI;

  constructor(llm: OpenAI) {
    this.llm = llm;
  }

  async generateSketch(question: string, feedback?: string): Promise<DSL> {
    const prompt = feedback
      ? `Question: ${question}\nBased on feedback: ${feedback}\nGenerate a reasoning sketch in JSON with keys: vars, rules, query.`
      : `Question: ${question}
Generate a reasoning sketch in JSON format with keys:
- vars: list of variable names (Boolean atoms)
- rules: list of rules (kind fact or imply)
  For imply rules, you can use either format:
  1. {"kind": "imply", "subject": "premise", "object": "conclusion"}
  2. {"kind": "imply", "if": ["premise1", "premise2"], "then": "conclusion"}
- query: the atom to be evaluated

Example for syllogism "All humans are mortal, Socrates is human, therefore Socrates is mortal":
{
  "vars": ["human_Socrates", "mortal_Socrates"],
  "rules": [
    {"kind": "fact", "subject": "human_Socrates"},
    {"kind": "imply", "if": ["human_Socrates"], "then": "mortal_Socrates"}
  ],
  "query": "mortal_Socrates"
}

Only output valid JSON, no other text.`;

    // console.log('Sending prompt to LLM:', prompt);

    const resp = await this.llm.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a logic reasoning assistant that outputs DSL in JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.0,
    });

    // console.log('Received response from LLM:', JSON.stringify(resp, null, 2));

    const text = resp.choices[0].message.content || '';
    // console.log('Response text:', text);
    
    let dsl: DSL;
    try {
      dsl = JSON.parse(text);
    } catch (e) {
      throw new Error("LLM output is not valid JSON: " + text);
    }
    return dsl;
  }

  async query(question: string, maxIters = 2): Promise<{ answer: string; sketch?: DSL }> {
    let feedback: string | undefined;

    for (let i = 0; i < maxIters; i++) {
      let sketch: DSL;
      try {
        sketch = await this.generateSketch(question, feedback);
        // console.log('Generated sketch:', JSON.stringify(sketch, null, 2));
      } catch (e) {
        feedback = `JSON parse error from LLM. Please output valid JSON. Error: ${e}`;
        continue;
      }

      // Initialize Z3 module if not already done
      const z3Module = await initializeZ3();
      
      // Create a new context for each iteration
      const interp = new DSLInterpreter(z3Module);
      const queryVar = interp.parse(sketch);
      const res = await interp.checkQuery(queryVar);

      if (res === "yes" || res === "no") {
        return { answer: res, sketch };
      } else {
        feedback = `Solver could not decide. Sketch was: ${JSON.stringify(sketch)}. Refine the rules.`;
      }
    }

    const fallback = await this.llm.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a logic reasoning assistant." },
        { role: "user", content: question },
      ],
      temperature: 0.0,
    });
    const fallbackAns = fallback.choices[0].message.content?.trim() || '';
    return { answer: fallbackAns };
  }
}