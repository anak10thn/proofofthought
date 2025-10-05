// Tipe DSL sederhana
export type Rule = {
  kind: "fact" | "imply";    // "fact" = assert, "imply" = implication
  // Support both formats:
  // 1. Original format: {subject: "...", object: "..."}
  // 2. LLM format: {if: "...", then: "..."} or {if: ["...", "..."], then: "..."}
  // 3. Negation format: {subject: "...", value: false} or {if: "...", then: "...", value: false}
  subject?: string;
  object?: string;
  if?: string | string[];
  then?: string;
  // Value field for explicit true/false assertions
  value?: boolean;
};

export type DSL = {
  vars: string[];
  rules: Rule[];
  query: string;
};