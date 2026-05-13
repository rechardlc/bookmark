# Chrome Bookmark Manager Extension Design

## Goal

Build a Chrome Manifest V3 extension that helps clean, classify, back up, and restore the user's browser bookmarks. The first version prioritizes data safety: the extension may automatically delete only low-risk exact duplicates after creating a backup, while all ambiguous cleanup and classification changes require user confirmation.

## Scope

The extension will support:

- Reading the full Chrome bookmark tree through `chrome.bookmarks`.
- Creating automatic backups before cleanup or classification actions.
- Saving recent backups inside extension storage.
- Exporting backups as JSON and HTML files.
- Detecting duplicate bookmark groups.
- Automatically deleting extra copies only when the title and normalized URL are exact matches.
- Presenting similar or ambiguous duplicates for manual review.
- Learning from existing bookmark folders and using a standard fallback taxonomy for uncategorized items.
- Previewing classification moves before applying them.
- Recording cleanup and classification operations so the user can understand what changed and restore from backup if needed.

Out of scope for the first version:

- Cloud sync outside Chrome's normal profile sync.
- Fully autonomous semantic cleanup.
- Mandatory AI processing.
- Cross-browser support beyond Chrome.

## Product Behavior

### Duplicate Cleanup

Duplicate detection uses multiple confidence levels:

- Low risk: same title and same normalized URL. The extension can auto-delete extra copies after backup.
- Medium risk: same normalized URL but different title, or same original URL with different folder placement. The extension shows a suggestion and waits for confirmation.
- Low confidence: similar title, same domain, or URLs that only look related. The extension groups them for review but does not preselect deletion.

URL normalization removes common tracking parameters such as `utm_*`, `fbclid`, `gclid`, and trailing hash fragments when they do not identify content. The original URL is still preserved in backups and review displays.

When choosing which exact duplicate to keep, the extension prefers:

1. A bookmark in the bookmarks bar or a user-created folder over an unclassified folder.
2. The earliest created bookmark when location quality is equal.
3. A cleaner title when timestamps and locations do not decide.

### Classification

Classification combines the user's existing folder structure with a fallback taxonomy.

The extension first scans existing folders and bookmark contents to infer folder themes from names, domains, and repeated title terms. When a bookmark clearly matches an existing folder, the extension proposes moving it there.

If no existing folder is a good match, the extension falls back to these categories:

- Development
- AI
- Learning
- Work
- Shopping
- Entertainment
- News
- Read Later
- Unclassified

All classification actions are previewed before execution. The preview shows the source folder, proposed destination folder, confidence, and reason.

### Backup And Restore

Backups are created before any destructive or bulk action. A backup contains:

- Full bookmark tree.
- Node ids.
- Titles.
- URLs.
- Folder hierarchy.
- Date added when Chrome provides it.
- Backup timestamp.
- Extension version.

The extension keeps recent backups in `chrome.storage.local` and lets the user export JSON and HTML backup files. Restore can rebuild the bookmark tree from a selected backup after warning the user that restore is a broad operation.

### User Interface

The extension uses a dedicated options page as the main workspace rather than a small popup-only interface.

Primary tabs:

- Overview: total bookmarks, duplicate groups, suggested moves, latest backup, and recent operation status.
- Duplicate Cleanup: exact duplicates available for automatic cleanup, plus ambiguous groups for manual review.
- Auto Classification: proposed destination folders, confidence, reasons, and bulk apply controls.
- Backup Restore: backup history, export actions, and restore flow.

The popup can provide quick entry points and a small status summary, but all review-heavy actions happen in the options page.

## Architecture

### Extension Shell

Use Chrome Manifest V3 with:

- `manifest.json` for extension metadata, permissions, background service worker, options page, and popup.
- A background service worker for bookmark operations, backup creation, and scheduled backup alarms.
- An options page for the main management UI.
- A lightweight popup for status and shortcuts.

Required Chrome permissions:

- `bookmarks` to read and modify bookmarks.
- `storage` to keep settings, operation history, and recent backups.
- `downloads` to export JSON and HTML backup files.
- `alarms` for scheduled automatic backups.

### Core Modules

The implementation should keep behavior testable by separating Chrome APIs from pure logic:

- Bookmark adapter: wraps `chrome.bookmarks`, `chrome.storage`, `chrome.downloads`, and `chrome.alarms`.
- Tree model: converts Chrome bookmark nodes into internal structures.
- URL normalizer: removes tracking noise and canonicalizes URLs.
- Duplicate engine: groups exact and similar duplicates, assigns confidence, and selects keep/delete candidates.
- Classification engine: learns folder signals, applies fallback taxonomy, and produces move proposals.
- Backup service: creates, stores, exports, and restores backups.
- Operation log: records cleanup and classification changes.
- UI state layer: loads analysis results and coordinates user actions.

Pure logic modules should not call Chrome APIs directly.

## Data Flow

Initial scan:

1. Options page asks background service worker to scan bookmarks.
2. Background service worker reads the bookmark tree.
3. Tree model flattens and indexes folders and bookmark nodes.
4. Duplicate engine returns exact and ambiguous duplicate groups.
5. Classification engine returns move proposals.
6. UI displays summary and review tables.

Cleanup:

1. User starts exact duplicate cleanup.
2. Backup service creates a new backup.
3. Duplicate engine confirms current candidates still exist.
4. Background service worker deletes selected duplicate nodes.
5. Operation log records deleted ids, kept ids, titles, URLs, and backup id.
6. UI refreshes analysis.

Classification:

1. User reviews proposed moves.
2. Backup service creates a new backup.
3. Background service worker creates missing fallback folders when needed.
4. Background service worker moves approved bookmarks.
5. Operation log records moves and backup id.
6. UI refreshes analysis.

## Error Handling

The extension must fail conservatively:

- If backup creation fails, cleanup or classification must stop.
- If a bookmark id no longer exists, skip it and report it in the operation result.
- If Chrome denies a bookmark operation, keep processing stopped for that batch and show the failed item.
- If export fails, keep the in-extension backup and show a retry option.
- If restore partially fails, report exactly which nodes could not be restored.

No destructive operation should run without a successful backup in the same workflow.

## Privacy

The first version runs locally in the browser extension. It does not upload bookmarks or call external AI services by default. Future AI classification can be added as an explicit optional feature with a clear opt-in setting and a preview of what data will be sent.

## Testing

Testing should cover pure logic and extension workflows:

- URL normalization removes tracking parameters without changing meaningful URLs.
- Duplicate engine groups exact duplicates and avoids auto-deleting ambiguous groups.
- Keep-candidate selection follows folder, date, and title rules.
- Classification engine prefers learned existing folders before fallback categories.
- Backup export preserves hierarchy and bookmark metadata.
- Cleanup refuses to proceed when backup creation fails.
- UI shows preview data and does not apply moves without confirmation.

Manual verification should load the unpacked extension in Chrome and test against a small synthetic bookmark set before using real bookmarks.

## Milestones

1. Scaffold Chrome MV3 extension with options page, popup, and background service worker.
2. Implement bookmark reading, tree model, and overview scan.
3. Implement backup creation, local storage retention, JSON export, and HTML export.
4. Implement URL normalization and duplicate detection.
5. Implement exact duplicate cleanup with backup gate and operation log.
6. Implement classification proposals from existing folders plus fallback taxonomy.
7. Implement preview and apply flow for classification.
8. Add restore flow and scheduled backups.
9. Add tests and manual Chrome verification notes.
