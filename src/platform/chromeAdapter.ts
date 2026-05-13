import type { BackupRecord, BookmarkTreeNode, OperationRecord } from "../core/types";

const BACKUPS_KEY = "bookmark-manager:backups";
const OPERATIONS_KEY = "bookmark-manager:operations";
const MAX_BACKUPS = 10;
const MAX_OPERATIONS = 50;

export async function getBookmarkTree(): Promise<BookmarkTreeNode[]> {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getTree((nodes) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(nodes as BookmarkTreeNode[]);
    });
  });
}

export async function removeBookmark(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.remove(id, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve();
    });
  });
}

export async function moveBookmark(id: string, parentId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.move(id, { parentId }, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve();
    });
  });
}

export async function createFolder(
  parentId: string,
  title: string
): Promise<chrome.bookmarks.BookmarkTreeNode> {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.create({ parentId, title }, (node) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(node);
    });
  });
}

export async function getBackups(): Promise<BackupRecord[]> {
  const result = await chrome.storage.local.get(BACKUPS_KEY);
  return result[BACKUPS_KEY] ?? [];
}

export async function saveBackup(backup: BackupRecord): Promise<void> {
  const backups = await getBackups();
  await chrome.storage.local.set({
    [BACKUPS_KEY]: [backup, ...backups].slice(0, MAX_BACKUPS)
  });
}

export async function getOperations(): Promise<OperationRecord[]> {
  const result = await chrome.storage.local.get(OPERATIONS_KEY);
  return result[OPERATIONS_KEY] ?? [];
}

export async function saveOperation(operation: OperationRecord): Promise<void> {
  const operations = await getOperations();
  await chrome.storage.local.set({
    [OPERATIONS_KEY]: [operation, ...operations].slice(0, MAX_OPERATIONS)
  });
}

export async function downloadText(
  filename: string,
  contents: string,
  mimeType: string
): Promise<void> {
  const url = `data:${mimeType};charset=utf-8,${encodeURIComponent(contents)}`;
  await chrome.downloads.download({ url, filename, saveAs: true });
}
