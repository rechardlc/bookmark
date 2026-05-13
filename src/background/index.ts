import { createBackupRecord, exportBookmarksHtml, exportBookmarksJson } from "../core/backupSerializer";
import { proposeClassifications } from "../core/classificationEngine";
import { findDuplicateGroups } from "../core/duplicateEngine";
import { createOperationRecord } from "../core/operationLog";
import { buildBookmarkIndex } from "../core/treeModel";
import type { ExtensionRequest, ExtensionResponse, ScanResult } from "../core/types";
import {
  downloadText,
  getBackups,
  getBookmarkTree,
  moveBookmark,
  removeBookmark,
  saveBackup,
  saveOperation
} from "../platform/chromeAdapter";

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("bookmark-manager-daily-backup", {
    periodInMinutes: 60 * 24
  });
});

chrome.runtime.onMessage.addListener((request: ExtensionRequest, _sender, sendResponse) => {
  handleRequest(request)
    .then((data) => {
      const response: ExtensionResponse<unknown> = { ok: true, data };
      sendResponse(response);
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "Unknown extension error";
      const response: ExtensionResponse<never> = { ok: false, error: message };
      sendResponse(response);
    });
  return true;
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "bookmark-manager-daily-backup") {
    void createAndStoreBackup().catch((error: unknown) => {
      console.error("Scheduled bookmark backup failed", error);
    });
  }
});

async function handleRequest(request: ExtensionRequest): Promise<unknown> {
  if (request.type === "scan") return scanBookmarks();
  if (request.type === "create-backup") return createAndStoreBackup();
  if (request.type === "cleanup-exact-duplicates") {
    return cleanupExactDuplicates(request.bookmarkIds);
  }
  if (request.type === "apply-classification") return applyClassification(request.moves);
  if (request.type === "export-backup") return exportBackup(request.backupId, request.format);
  if (request.type === "restore-backup") return restoreBackup(request.backupId);
  throw new Error("Unsupported request type");
}

async function scanBookmarks(): Promise<ScanResult> {
  const tree = await getBookmarkTree();
  const index = buildBookmarkIndex(tree);
  const backups = await getBackups();

  return {
    bookmarkCount: index.bookmarks.length,
    folderCount: index.folders.length,
    duplicateGroups: findDuplicateGroups(index.bookmarks),
    classificationProposals: proposeClassifications(index),
    latestBackup: backups[0]
  };
}

async function createAndStoreBackup() {
  const tree = await getBookmarkTree();
  const backup = createBackupRecord(tree, chrome.runtime.getManifest().version);
  await saveBackup(backup);
  await saveOperation(
    createOperationRecord({
      type: "backup",
      createdAt: backup.createdAt,
      backupId: backup.id,
      summary: "Created bookmark backup",
      details: { backupId: backup.id }
    })
  );
  return backup;
}

async function cleanupExactDuplicates(bookmarkIds: string[]) {
  const backup = await createAndStoreBackup();
  for (const id of bookmarkIds) {
    await removeBookmark(id);
  }
  const operation = createOperationRecord({
    type: "duplicate-cleanup",
    createdAt: new Date().toISOString(),
    backupId: backup.id,
    summary: `Deleted ${bookmarkIds.length} exact duplicate bookmarks`,
    details: { deletedIds: bookmarkIds }
  });
  await saveOperation(operation);
  return operation;
}

async function exportBackup(backupId: string, format: "json" | "html") {
  const backups = await getBackups();
  const backup = backups.find((item) => item.id === backupId);
  if (!backup) throw new Error("Backup not found");

  if (format === "json") {
    await downloadText(`${backup.id}.json`, exportBookmarksJson(backup), "application/json");
  } else {
    await downloadText(`${backup.id}.html`, exportBookmarksHtml(backup.tree), "text/html");
  }

  return { exported: backup.id, format };
}

async function applyClassification(moves: Array<{ bookmarkId: string; parentId: string }>) {
  const backup = await createAndStoreBackup();
  for (const move of moves) {
    await moveBookmark(move.bookmarkId, move.parentId);
  }
  const operation = createOperationRecord({
    type: "classification",
    createdAt: new Date().toISOString(),
    backupId: backup.id,
    summary: `Moved ${moves.length} bookmarks`,
    details: { moves }
  });
  await saveOperation(operation);
  return operation;
}

async function restoreBackup(backupId: string) {
  const backups = await getBackups();
  const backup = backups.find((item) => item.id === backupId);
  if (!backup) throw new Error("Backup not found");

  const safetyBackup = await createAndStoreBackup();
  const operation = createOperationRecord({
    type: "restore",
    createdAt: new Date().toISOString(),
    backupId: safetyBackup.id,
    summary: `Restore requested for ${backup.id}`,
    details: {
      restoredBackupId: backup.id,
      note: "Full destructive restore is deferred until manual verification confirms Chrome root behavior."
    }
  });
  await saveOperation(operation);
  return operation;
}

