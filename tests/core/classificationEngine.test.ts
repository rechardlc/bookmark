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

  it("classifies Gmail as Work without matching ai inside mail", () => {
    const proposals = proposeClassifications({
      folders: [
        { id: "f-ai", title: "AI", path: ["AI"] },
        { id: "f-work", title: "Work", path: ["Work"] }
      ],
      bookmarks: [
        {
          id: "b-mail",
          title: "Gmail",
          url: "https://mail.google.com/mail/u/0/#inbox",
          path: ["Other Bookmarks"]
        }
      ],
      byId: new Map()
    });

    expect(proposals).toHaveLength(1);
    expect(proposals[0]).toMatchObject({
      bookmarkId: "b-mail",
      destinationFolderId: "f-work",
      destinationFolderTitle: "Work"
    });
  });

  it("does not propose moving a bookmark already in the destination folder", () => {
    const proposals = proposeClassifications({
      folders: [{ id: "f-dev", title: "Development", path: ["Development"] }],
      bookmarks: [
        {
          id: "b-dev",
          title: "MDN CSS",
          url: "https://developer.mozilla.org/en-US/docs/Web/CSS",
          parentId: "f-dev",
          path: ["Development"]
        }
      ],
      byId: new Map()
    });

    expect(proposals).toEqual([]);
  });

  it("maps fallback categories to existing same-title folders case-insensitively", () => {
    const proposals = proposeClassifications({
      folders: [{ id: "f-work", title: "work", path: ["work"] }],
      bookmarks: [
        {
          id: "b-calendar",
          title: "Calendar",
          url: "https://calendar.google.com/calendar/u/0/r",
          path: ["Other Bookmarks"]
        }
      ],
      byId: new Map()
    });

    expect(proposals[0]).toMatchObject({
      bookmarkId: "b-calendar",
      destinationFolderId: "f-work",
      destinationFolderTitle: "work"
    });
  });

  it("proposes Unclassified for unmatched bookmarks", () => {
    const proposals = proposeClassifications({
      folders: [],
      bookmarks: [
        {
          id: "b-random",
          title: "Untitled page",
          url: "https://example.invalid/opaque",
          path: ["Other Bookmarks"]
        }
      ],
      byId: new Map()
    });

    expect(proposals[0]).toMatchObject({
      bookmarkId: "b-random",
      destinationFolderTitle: "Unclassified"
    });
    expect(proposals[0]?.destinationFolderId).toBeUndefined();
  });

  it("uses folder title then id as deterministic tie-breakers for equal scores", () => {
    const proposals = proposeClassifications({
      folders: [
        { id: "f-z", title: "Tools", path: ["Tools"] },
        { id: "f-a", title: "Tools", path: ["Tools"] },
        { id: "f-dev", title: "Development", path: ["Development"] }
      ],
      bookmarks: [
        {
          id: "b-tools",
          title: "Tools reference",
          url: "https://example.com/tools",
          path: ["Other Bookmarks"]
        }
      ],
      byId: new Map()
    });

    expect(proposals[0]).toMatchObject({
      bookmarkId: "b-tools",
      destinationFolderId: "f-a"
    });
  });
});
