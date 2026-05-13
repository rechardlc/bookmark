import { describe, expect, it } from "vitest";
import { createBackupRecord, exportBookmarksHtml, exportBookmarksJson } from "../../src/core/backupSerializer";
import type { BookmarkTreeNode } from "../../src/core/types";
import { sampleTree } from "../fixtures/bookmarkTrees";

describe("backupSerializer", () => {
  it("creates a versioned backup record with full tree", () => {
    const backup = createBackupRecord(sampleTree, "0.1.0", "2026-05-13T00:00:00.000Z");

    expect(backup.id).toBe("backup-2026-05-13T00-00-00-000Z");
    expect(backup.extensionVersion).toBe("0.1.0");
    expect(backup.tree).toEqual(sampleTree);
  });

  it("deep-clones the backup tree", () => {
    const backup = createBackupRecord(sampleTree, "0.1.0", "2026-05-13T00:00:00.000Z");

    expect(backup.tree).not.toBe(sampleTree);
    expect(backup.tree[0].children).not.toBe(sampleTree[0].children);
  });

  it("exports Netscape bookmark HTML", () => {
    const html = exportBookmarksHtml(sampleTree);

    expect(html).toContain("<!DOCTYPE NETSCAPE-Bookmark-file-1>");
    expect(html).toContain('<A HREF="https://openai.com/" ADD_DATE="2">OpenAI</A>');
  });

  it("escapes bookmark title and URL values in HTML", () => {
    const tree: BookmarkTreeNode[] = [
      {
        id: "1",
        title: 'Research <AI> & "ML"',
        url: 'https://example.com/?q=<ai>&mode="fast"'
      }
    ];

    const html = exportBookmarksHtml(tree);

    expect(html).toContain(
      '<A HREF="https://example.com/?q=&lt;ai&gt;&amp;mode=&quot;fast&quot;" ADD_DATE="">Research &lt;AI&gt; &amp; &quot;ML&quot;</A>'
    );
  });

  it('exports epoch dateAdded as ADD_DATE="0"', () => {
    const tree: BookmarkTreeNode[] = [
      {
        id: "1",
        title: "Epoch",
        url: "https://example.com/",
        dateAdded: 0
      }
    ];

    const html = exportBookmarksHtml(tree);

    expect(html).toContain('<A HREF="https://example.com/" ADD_DATE="0">Epoch</A>');
  });

  it("exports pretty backup JSON with expected fields", () => {
    const backup = createBackupRecord(sampleTree, "0.1.0", "2026-05-13T00:00:00.000Z");

    const json = exportBookmarksJson(backup);

    expect(json).toContain('{\n  "id": "backup-2026-05-13T00-00-00-000Z",');
    expect(json).toContain('\n  "extensionVersion": "0.1.0",');
    expect(JSON.parse(json)).toEqual(backup);
  });
});
