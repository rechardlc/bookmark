import { describe, expect, it } from "vitest";
import { proposeClassifications } from "../../src/core/classificationEngine";
import type { BookmarkIndex } from "../../src/core/types";

const index: BookmarkIndex = {
  folders: [
    { id: "f-ai", title: "AI Tools", path: ["AI Tools"] },
    { id: "f-dev", title: "Development", path: ["Development"] }
  ],
  bookmarks: [
    {
      id: "b1",
      title: "OpenAI Platform",
      url: "https://platform.openai.com/docs",
      path: ["Other Bookmarks"]
    },
    {
      id: "b2",
      title: "MDN CSS",
      url: "https://developer.mozilla.org/en-US/docs/Web/CSS",
      path: ["Other Bookmarks"]
    }
  ],
  byId: new Map()
};

describe("proposeClassifications", () => {
  it("prefers existing matching folders before fallback categories", () => {
    const proposals = proposeClassifications(index);

    expect(proposals.find((proposal) => proposal.bookmarkId === "b1")?.destinationFolderId).toBe("f-ai");
    expect(proposals.find((proposal) => proposal.bookmarkId === "b2")?.destinationFolderId).toBe("f-dev");
  });
});
