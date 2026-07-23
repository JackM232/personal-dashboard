import { api } from "../../api/client";
import type { LeetCodeEntry, LeetCodeProblem } from "./types";

export const leetcodeApi = {
  listProblems: () => api.get<LeetCodeProblem[]>("/api/problems"),
  createProblem: (body: Partial<LeetCodeProblem>) =>
    api.post<LeetCodeProblem>("/api/problems", body),
  updateProblem: (id: string, body: Partial<LeetCodeProblem>) =>
    api.put<LeetCodeProblem>(`/api/problems/${id}`, body),
  deleteProblem: (id: string) => api.delete<void>(`/api/problems/${id}`),
  listEntries: () => api.get<LeetCodeEntry[]>("/api/entries"),
  createEntry: (body: Partial<LeetCodeEntry>) => api.post<LeetCodeEntry>("/api/entries", body),
  updateEntry: (id: string, body: Partial<LeetCodeEntry>) =>
    api.put<LeetCodeEntry>(`/api/entries/${id}`, body),
  deleteEntry: (id: string) => api.delete<void>(`/api/entries/${id}`),
};
