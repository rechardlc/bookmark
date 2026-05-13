import type { BackupRecord, BookmarkTreeNode } from "./types";

export function createBackupRecord(
  tree: BookmarkTreeNode[],
  extensionVersion: string,
  createdAt = new Date().toISOString()
): BackupRecord {
  return {
    id: `backup-${toSafeId(createdAt)}`,
    createdAt,
    extensionVersion,
    tree: structuredClone(tree)
  };
}

export function exportBookmarksJson(backup: BackupRecord): string {
  return JSON.stringify(backup, null, 2);
}

export function exportBookmarksHtml(tree: BookmarkTreeNode[]): string {
  const lines = [
    "<!DOCTYPE NETSCAPE-Bookmark-file-1>",
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    "<TITLE>Bookmarks</TITLE>",
    "<H1>Bookmarks</H1>",
    "<DL><p>"
  ];

  for (const node of tree) {
    appendNodeHtml(lines, node, 1);
  }

  lines.push("</DL><p>");
  return lines.join("\n");
}

function appendNodeHtml(lines: string[], node: BookmarkTreeNode, depth: number) {
  const indent = "    ".repeat(depth);
  if (node.url) {
    const addDate = node.dateAdded !== undefined ? Math.floor(node.dateAdded / 1000) : "";
    lines.push(`${indent}<DT><A HREF="${escapeHtml(node.url)}" ADD_DATE="${addDate}">${escapeHtml(node.title)}</A>`);
    return;
  }

  if (node.title) {
    lines.push(`${indent}<DT><H3>${escapeHtml(node.title)}</H3>`);
    lines.push(`${indent}<DL><p>`);
  }

  for (const child of node.children ?? []) {
    appendNodeHtml(lines, child, depth + 1);
  }

  if (node.title) {
    lines.push(`${indent}</DL><p>`);
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function toSafeId(value: string): string {
  return value.replace(/[:.]/g, "-");
}
