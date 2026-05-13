import { describe, expect, it } from "vitest";
import { createBackupRecord, exportBookmarksHtml } from "../../src/core/backupSerializer";
import { sampleTree } from "../fixtures/bookmarkTrees";

describe("backupSerializer", () => {
  it("creates a versioned backup record with full tree", () => {
    const backup = createBackupRecord(sampleTree, "0.1.0", "2026-05-13T00:00:00.000Z");

    expect(backup.id).toBe("backup-2026-05-13T00-00-00-000Z");
    expect(backup.extensionVersion).toBe("0.1.0");
    expect(backup.tree).toEqual(sampleTree);
  });

  it("exports Netscape bookmark HTML", () => {
    const html = exportBookmarksHtml(sampleTree);

    expect(html).toContain("<!DOCTYPE NETSCAPE-Bookmark-file-1>");
    expect(html).toContain('<A HREF="https://openai.com/" ADD_DATE="2">OpenAI</A>');
  });
});
