# Proof of Thought (PoT)

A Proof of Thought system combining LLM reasoning with Z3 theorem proving for logical verification.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=flat&logo=node.js&logoColor=white)

## Overview

Proof of Thought (PoT) is a novel approach to logical reasoning that combines the creative power of Large Language Models (LLMs) with the precision of formal theorem proving. The system works by having an LLM generate a "reasoning sketch" in a domain-specific language (DSL), which is then formally verified using the Z3 SMT solver.

This ensures that while the LLM provides intuitive reasoning steps, the final answer is mathematically sound and logically consistent.

## Features

- 🧠 **LLM-Powered Reasoning**: Uses GPT-4 to generate logical reasoning sketches
- 🔍 **Formal Verification**: Employs Z3 theorem prover for mathematical correctness
- 📚 **Logical DSL**: Simple domain-specific language for expressing logical statements
- ⚡ **CLI Tool**: Command-line interface for quick reasoning tasks
- 📦 **Library**: Reusable TypeScript library for integration into other projects

## Installation

### As a CLI Tool

```bash
npx proofofthought "Is Socrates mortal if he is human and all humans are mortal?"
```

### As a Library

```bash
npm install proofofthought
```

## Usage

### Command Line Interface

```bash
# Ask a question directly
npx proofofthought "All birds can fly. Penguins are birds. Can penguins fly?"

# Or pipe in a question
echo "If it rains, the ground gets wet. It is raining. Is the ground wet?" | npx proofofthought
```

### As a Library

```typescript
import { ProofOfThoughtJS } from 'proofofthought';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pot = new ProofOfThoughtJS(openai);

const result = await pot.query("Are all cats mammals?", 3);
console.log("Answer:", result.answer);
```

## How It Works

1. **Question Analysis**: The LLM analyzes the input question and generates a reasoning sketch
2. **DSL Generation**: The sketch is converted to a formal DSL with variables, facts, and rules
3. **Logical Translation**: The DSL is translated into Z3 constraints
4. **Formal Verification**: Z3 attempts to prove or disprove the query
5. **Result**: Returns "yes", "no", or falls back to LLM if undecidable

### Example DSL

```json
{
  "vars": ["human_Socrates", "mortal_Socrates"],
  "rules": [
    {"kind": "fact", "subject": "human_Socrates"},
    {"kind": "imply", "if": ["human_Socrates"], "then": "mortal_Socrates"}
  ],
  "query": "mortal_Socrates"
}
```

## Requirements

- Node.js >= 16
- OpenAI API key (for LLM functionality)

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/anak10thn/proofofthought.git
   cd proofofthought
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set your OpenAI API key:
   ```bash
   export OPENAI_API_KEY=your_api_key_here
   ```

4. Build the project:
   ```bash
   npm run build
   ```

## Development

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run the example in development mode
- `npm run example` - Run the compiled example

## API Reference

### ProofOfThoughtJS

Main class for performing proof of thought reasoning.

```typescript
constructor(openai: OpenAI)
```

#### Methods

- `query(question: string, maxIters?: number): Promise<{ answer: string; sketch?: DSL }>`
  - Performs reasoning on the given question
  - Returns the answer ("yes", "no") and the reasoning sketch

### DSL Types

```typescript
type Rule = {
  kind: "fact" | "imply";
  subject?: string;
  object?: string;
  if?: string | string[];
  then?: string;
};

type DSL = {
  vars: string[];
  rules: Rule[];
  query: string;
};
```

## Examples

```bash
# Classic syllogism
npx proofofthought "All humans are mortal. Socrates is human. Is Socrates mortal?"

# Logical puzzle
npx proofofthought "If it's raining, I stay inside. If I stay inside, I read books. It's raining. Do I read books?"

# Mathematical reasoning
npx proofofthought "All even numbers are divisible by 2. 4 is an even number. Is 4 divisible by 2?"
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Acknowledgments

- [OpenAI](https://openai.com/) for the GPT models
- [Z3](https://github.com/Z3Prover/z3) theorem prover
- [z3-solver](https://www.npmjs.com/package/z3-solver) JavaScript bindings for Z3

## Contact

Author: anak10thn@gmail.com

Project Link: [https://github.com/anak10thn/proofofthought](https://github.com/anak10thn/proofofthought)