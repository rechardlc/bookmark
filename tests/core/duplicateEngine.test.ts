import { describe, expect, it } from "vitest";
import { findDuplicateGroups } from "../../src/core/duplicateEngine";
import type { IndexedBookmark } from "../../src/core/types";

const bookmarks: IndexedBookmark[] = [
  {
    id: "a",
    title: "OpenAI",
    url: "https://openai.com/?utm_source=newsletter",
    dateAdded: 100,
    path: ["Bookmarks Bar"]
  },
  {
    id: "b",
    title: "OpenAI",
    url: "https://openai.com/",
    dateAdded: 200,
    path: ["Other Bookmarks"]
  },
  {
    id: "c",
    title: "OpenAI Docs",
    url: "https://openai.com/",
    dateAdded: 300,
    path: ["AI"]
  }
];

describe("findDuplicateGroups", () => {
  it("marks exact title and normalized URL matches as low-risk", () => {
    const groups = findDuplicateGroups(bookmarks);
    const exact = groups.find((group) => group.confidence === "low-risk");

    expect(exact?.candidates.map((candidate) => candidate.id)).toEqual(["a", "b"]);
    expect(exact?.candidates.find((candidate) => candidate.id === "a")?.action).toBe("keep");
    expect(exact?.candidates.find((candidate) => candidate.id === "b")?.action).toBe("delete");
  });

  it("marks same normalized URL with different title as medium-risk review", () => {
    const groups = findDuplicateGroups(bookmarks);
    const medium = groups.find((group) => group.confidence === "medium-risk");

    expect(medium?.candidates.map((candidate) => candidate.action)).toEqual([
      "review",
      "review",
      "review"
    ]);
  });

  it("does not mark same-title URLs with different meaningful hashes as low-risk", () => {
    const groups = findDuplicateGroups([
      {
        id: "docs-intro",
        title: "Docs",
        url: "https://example.com/docs#intro",
        dateAdded: 100,
        path: ["Bookmarks Bar"]
      },
      {
        id: "docs-api",
        title: "Docs",
        url: "https://example.com/docs#api",
        dateAdded: 200,
        path: ["Bookmarks Bar"]
      }
    ]);

    expect(groups.find((group) => group.confidence === "low-risk")).toBeUndefined();
  });
});
