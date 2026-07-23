export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type Status = "UNATTEMPTED" | "STARTED" | "COMPLETED";

export type TopicTag =
  | "ARRAY"
  | "STRING"
  | "LINKED_LIST"
  | "STACK"
  | "QUEUE"
  | "HASH_MAP"
  | "TWO_POINTERS"
  | "SLIDING_WINDOW"
  | "BINARY_SEARCH"
  | "TREE"
  | "TRIE"
  | "HEAP"
  | "GRAPH"
  | "BACKTRACKING"
  | "DYNAMIC_PROGRAMMING"
  | "GREEDY"
  | "INTERVALS"
  | "MATRIX"
  | "BIT_MANIPULATION"
  | "MATH";

export interface LeetCodeProblem {
  id: string;
  number: number;
  name: string;
  difficulty: Difficulty;
  topicTag: TopicTag;
  createdAt: string;
}

export interface LeetCodeEntry {
  id: string;
  userId: string;
  problemId: string;
  status: Status;
  hintsUsed: number;
  videoWatched: boolean;
  timeTaken: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  problem?: LeetCodeProblem;
}
