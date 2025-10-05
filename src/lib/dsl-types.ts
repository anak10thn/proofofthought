// Tipe DSL sederhana
export type Rule = {
  kind: "fact" | "imply";    // "fact" = assert, "imply" = implication
  // Support both formats:
  // 1. Original format: {subject: "...", object: "..."}
  // 2. LLM format: {if: "...", then: "..."} or {if: ["...", "..."], then: "..."}
  subject?: string;
  object?: string;
  if?: string | string[];
  then?: string;
};

export type DSL = {
  vars: string[];
  rules: Rule[];
  query: string;
};