import type { FieldConfig } from "../../components/EntityFormModal";
import type { LeetCodeProblem } from "./types";

export const problemFields: FieldConfig<LeetCodeProblem>[] = [
  { key: "number", label: "Problem #", type: "number", required: true },
  { key: "name", label: "Name", type: "text", required: true },
  {
    key: "difficulty",
    label: "Difficulty",
    type: "select",
    options: ["EASY", "MEDIUM", "HARD"],
    required: true,
  },
  {
    key: "topicTag",
    label: "Topic",
    type: "select",
    options: [
      "ARRAY",
      "STRING",
      "LINKED_LIST",
      "STACK",
      "QUEUE",
      "HASH_MAP",
      "TWO_POINTERS",
      "SLIDING_WINDOW",
      "BINARY_SEARCH",
      "TREE",
      "TRIE",
      "HEAP",
      "GRAPH",
      "BACKTRACKING",
      "DYNAMIC_PROGRAMMING",
      "GREEDY",
      "INTERVALS",
      "MATRIX",
      "BIT_MANIPULATION",
      "MATH",
    ],
    required: true,
  },
];

// EntityFormModal hands back every field as a string; normalise "number" to
// what the API expects.
export function toProblemBody(values: Partial<LeetCodeProblem>): Partial<LeetCodeProblem> {
  return {
    ...values,
    number: values.number === undefined ? undefined : Number(values.number),
  };
}
