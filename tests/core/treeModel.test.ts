import { describe, expect, it } from "vitest";
import { buildBookmarkIndex } from "../../src/core/treeModel";
import { sampleTree } from "../fixtures/bookmarkTrees";

describe("buildBookmarkIndex", () => {
  it("flattens bookmarks and folders with parent paths", () => {
    const index = buildBookmarkIndex(sampleTree);

    expect(index.bookmarks).toHaveLength(2);
    expect(index.folders.map((folder) => folder.title)).toContain("AI");
    expect(index.bookmarks.find((node) => node.id === "21")?.path).toEqual([
      "Other Bookmarks",
      "AI"
    ]);
  });
});
