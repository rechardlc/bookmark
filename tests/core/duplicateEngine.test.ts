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

  it("does not include low-risk exact duplicate candidates in medium-risk groups", () => {
    const groups = findDuplicateGroups(bookmarks);
    const medium = groups.find((group) => group.confidence === "medium-risk");

    expect(medium).toBeUndefined();
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

  it("marks same normalized URL with different titles as medium-risk review when no exact duplicates overlap", () => {
    const groups = findDuplicateGroups([
      {
        id: "first",
        title: "Example",
        url: "https://example.com/?utm_source=newsletter",
        dateAdded: 100,
        path: ["Bookmarks Bar"]
      },
      {
        id: "second",
        title: "Example Docs",
        url: "https://example.com/",
        dateAdded: 200,
        path: ["AI"]
      }
    ]);
    const medium = groups.find((group) => group.confidence === "medium-risk");

    expect(medium?.candidates.map((candidate) => candidate.id)).toEqual(["first", "second"]);
    expect(medium?.candidates.map((candidate) => candidate.action)).toEqual(["review", "review"]);
  });

  it("keeps the Bookmarks Bar candidate over other folders", () => {
    const groups = findDuplicateGroups([
      {
        id: "other",
        title: "Example",
        url: "https://example.com/",
        dateAdded: 100,
        path: ["Other Bookmarks"]
      },
      {
        id: "bar",
        title: "Example",
        url: "https://example.com/",
        dateAdded: 200,
        path: ["Bookmarks Bar"]
      }
    ]);
    const exact = groups.find((group) => group.confidence === "low-risk");

    expect(exact?.candidates.find((candidate) => candidate.action === "keep")?.id).toBe("bar");
  });

  it("does not treat nested backup folders as the Bookmarks Bar root", () => {
    const groups = findDuplicateGroups([
      {
        id: "backup",
        title: "Example",
        url: "https://example.com/",
        dateAdded: 100,
        path: ["Imported", "Old Bookmarks Bar Backup"]
      },
      {
        id: "bar",
        title: "Example",
        url: "https://example.com/",
        dateAdded: 200,
        path: ["Bookmarks Bar"]
      }
    ]);
    const exact = groups.find((group) => group.confidence === "low-risk");

    expect(exact?.candidates.find((candidate) => candidate.action === "keep")?.id).toBe("bar");
  });

  it("keeps the earliest added candidate within equal folder priority", () => {
    const groups = findDuplicateGroups([
      {
        id: "newer",
        title: "Example",
        url: "https://example.com/",
        dateAdded: 200,
        path: ["Other Bookmarks"]
      },
      {
        id: "older",
        title: "Example",
        url: "https://example.com/",
        dateAdded: 100,
        path: ["AI"]
      }
    ]);
    const exact = groups.find((group) => group.confidence === "low-risk");

    expect(exact?.candidates.find((candidate) => candidate.action === "keep")?.id).toBe("older");
  });

  it("uses id as a deterministic tie-breaker when priority and date are equal", () => {
    const groups = findDuplicateGroups([
      {
        id: "z",
        title: "Example",
        url: "https://example.com/",
        path: ["Other Bookmarks"]
      },
      {
        id: "a",
        title: "Example",
        url: "https://example.com/",
        path: ["AI"]
      }
    ]);
    const exact = groups.find((group) => group.confidence === "low-risk");

    expect(exact?.candidates.find((candidate) => candidate.action === "keep")?.id).toBe("a");
  });
});
