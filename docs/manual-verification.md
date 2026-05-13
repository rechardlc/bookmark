# Manual Verification

## Build

Run:

```powershell
npm install
npm run test
npm run typecheck
npm run build
```

Expected:

- Tests pass.
- TypeScript reports no errors.
- Vite creates `dist/manifest.json`.

## Load In Chrome

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click "Load unpacked".
4. Select `C:\Users\33002\Desktop\bookmark\.worktrees\codex\bookmark-manager\dist`.
5. Open the extension options page.

## Synthetic Bookmark Test

Create a temporary folder named `Bookmark Manager Test` with:

- Two identical `OpenAI` bookmarks pointing to `https://openai.com/`.
- One `OpenAI` bookmark pointing to `https://openai.com/?utm_source=test`.
- One `MDN CSS` bookmark pointing to `https://developer.mozilla.org/en-US/docs/Web/CSS`.

Expected:

- Overview shows bookmark and duplicate counts.
- Duplicate Cleanup shows low-risk duplicate candidates.
- Running cleanup creates a backup first and removes only extra exact duplicates.
- Auto Classification shows proposals for AI and Development categories.
- Backup Restore can create and export JSON and HTML backups.

## Real Bookmark Safety

Before using real bookmarks:

- Export a Chrome native bookmark backup from Bookmark Manager.
- Run the extension's "立即备份".
- Export the extension JSON backup.
- Only then run duplicate cleanup.
