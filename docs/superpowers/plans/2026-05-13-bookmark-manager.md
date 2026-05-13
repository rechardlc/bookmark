# Bookmark Manager Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chrome Manifest V3 extension that scans bookmarks, backs them up, detects duplicates, safely removes exact duplicates, proposes classification moves, and supports export/restore workflows.

**Architecture:** Use a TypeScript Chrome extension with pure logic modules under `src/core`, Chrome API wrappers under `src/platform`, a Manifest V3 background service worker under `src/background`, and review-oriented pages under `src/options` and `src/popup`. Pure logic is tested with Vitest before it is wired to Chrome APIs.

**Tech Stack:** TypeScript, Vite, Vitest, Chrome Manifest V3 APIs (`bookmarks`, `storage`, `downloads`, `alarms`), plain HTML/CSS UI.

---

## File Structure

- Create `package.json`: npm scripts, Vite/Vitest dependencies, Chrome type definitions.
- Create `tsconfig.json`: strict TypeScript settings for extension and tests.
- Create `vite.config.ts`: builds background, options, and popup entry points into `dist`.
- Create `vitest.config.ts`: unit test runner config.
- Create `public/manifest.json`: Chrome MV3 manifest with required permissions.
- Create `public/options.html`: options page shell.
- Create `public/popup.html`: popup shell.
- Create `src/core/types.ts`: shared bookmark, backup, duplicate, classification, and operation types.
- Create `src/core/urlNormalizer.ts`: URL canonicalization and tracking parameter removal.
- Create `src/core/treeModel.ts`: flatten bookmark trees and index folders.
- Create `src/core/duplicateEngine.ts`: duplicate grouping and keep/delete candidate selection.
- Create `src/core/classificationEngine.ts`: existing-folder learning and fallback category proposals.
- Create `src/core/backupSerializer.ts`: JSON and Netscape HTML bookmark export generation.
- Create `src/core/operationLog.ts`: operation record builders.
- Create `src/platform/chromeAdapter.ts`: Promise wrappers for Chrome APIs.
- Create `src/background/index.ts`: message router and workflow orchestration.
- Create `src/options/options.ts`: options page state, rendering, and action handlers.
- Create `src/options/options.css`: options page layout and table styles.
- Create `src/popup/popup.ts`: popup status and navigation shortcuts.
- Create `src/popup/popup.css`: popup layout.
- Create `tests/fixtures/bookmarkTrees.ts`: synthetic bookmark trees for tests.
- Create `tests/core/*.test.ts`: unit tests for pure logic.
- Create `docs/manual-verification.md`: Chrome unpacked-extension verification checklist.

## Task 1: Project Scaffold And Extension Shell

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `public/manifest.json`
- Create: `public/options.html`
- Create: `public/popup.html`
- Create: `src/background/index.ts`
- Create: `src/options/options.ts`
- Create: `src/options/options.css`
- Create: `src/popup/popup.ts`
- Create: `src/popup/popup.css`

- [ ] **Step 1: Create npm project metadata**

Create `package.json`:

```json
{
  "name": "bookmark-manager-extension",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/chrome": "^0.0.270",
    "typescript": "^5.6.3",
    "vite": "^5.4.10",
    "vitest": "^2.1.4"
  }
}
```

- [ ] **Step 2: Create TypeScript config**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["chrome", "vitest/globals"]
  },
  "include": ["src", "tests", "vite.config.ts", "vitest.config.ts"]
}
```

- [ ] **Step 3: Create Vite build config**

Create `vite.config.ts`:

```ts
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, "src/background/index.ts"),
        options: resolve(__dirname, "public/options.html"),
        popup: resolve(__dirname, "public/popup.html")
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]"
      }
    }
  },
  publicDir: "public"
});
```

- [ ] **Step 4: Create Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: true
  }
});
```

- [ ] **Step 5: Create Chrome manifest**

Create `public/manifest.json`:

```json
{
  "manifest_version": 3,
  "name": "Bookmark Manager",
  "description": "Safely clean duplicates, classify bookmarks, and create local backups.",
  "version": "0.1.0",
  "permissions": ["bookmarks", "storage", "downloads", "alarms"],
  "background": {
    "service_worker": "assets/background.js",
    "type": "module"
  },
  "options_page": "options.html",
  "action": {
    "default_title": "Bookmark Manager",
    "default_popup": "popup.html"
  }
}
```

- [ ] **Step 6: Create options and popup shells**

Create `public/options.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Bookmark Manager</title>
    <script type="module" src="/src/options/options.ts"></script>
  </head>
  <body>
    <main id="app"></main>
  </body>
</html>
```

Create `public/popup.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Bookmark Manager</title>
    <script type="module" src="/src/popup/popup.ts"></script>
  </head>
  <body>
    <main id="popup"></main>
  </body>
</html>
```

- [ ] **Step 7: Add temporary entry files**

Create `src/background/index.ts`:

```ts
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("bookmark-manager-daily-backup", {
    periodInMinutes: 60 * 24
  });
});
```

Create `src/options/options.ts`:

```ts
import "./options.css";

const app = document.querySelector<HTMLDivElement>("#app");

if (app) {
  app.innerHTML = `
    <section class="page">
      <h1>Bookmark Manager</h1>
      <p>书签分析功能正在初始化。</p>
    </section>
  `;
}
```

Create `src/options/options.css`:

```css
body {
  margin: 0;
  font-family: Arial, "Microsoft YaHei", sans-serif;
  background: #f5f7fb;
  color: #1f2937;
}

.page {
  max-width: 1120px;
  margin: 0 auto;
  padding: 32px;
}
```

Create `src/popup/popup.ts`:

```ts
import "./popup.css";

const popup = document.querySelector<HTMLDivElement>("#popup");

if (popup) {
  popup.innerHTML = `
    <section class="popup">
      <h1>Bookmark Manager</h1>
      <button id="open-options" type="button">打开管理页</button>
    </section>
  `;

  document.querySelector("#open-options")?.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
}
```

Create `src/popup/popup.css`:

```css
body {
  margin: 0;
  min-width: 260px;
  font-family: Arial, "Microsoft YaHei", sans-serif;
  color: #1f2937;
}

.popup {
  padding: 16px;
}

button {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #ffffff;
  cursor: pointer;
}
```

- [ ] **Step 8: Install dependencies**

Run:

```powershell
npm install
```

Expected: `package-lock.json` is created and npm exits with code 0.

- [ ] **Step 9: Verify scaffold**

Run:

```powershell
npm run typecheck
npm run build
```

Expected: both commands exit with code 0 and `dist/manifest.json` exists.

- [ ] **Step 10: Commit scaffold**

```powershell
git add package.json package-lock.json tsconfig.json vite.config.ts vitest.config.ts public src
git commit -m "feat: scaffold chrome bookmark extension"
```

## Task 2: Shared Types And Bookmark Tree Model

**Files:**
- Create: `src/core/types.ts`
- Create: `src/core/treeModel.ts`
- Create: `tests/fixtures/bookmarkTrees.ts`
- Create: `tests/core/treeModel.test.ts`

- [ ] **Step 1: Write failing tree model tests**

Create `tests/fixtures/bookmarkTrees.ts`:

```ts
import type { BookmarkTreeNode } from "../../src/core/types";

export const sampleTree: BookmarkTreeNode[] = [
  {
    id: "0",
    title: "",
    children: [
      {
        id: "1",
        title: "Bookmarks Bar",
        children: [
          {
            id: "10",
            title: "MDN",
            url: "https://developer.mozilla.org/",
            dateAdded: 1000
          }
        ]
      },
      {
        id: "2",
        title: "Other Bookmarks",
        children: [
          {
            id: "20",
            title: "AI",
            children: [
              {
                id: "21",
                title: "OpenAI",
                url: "https://openai.com/",
                dateAdded: 2000
              }
            ]
          }
        ]
      }
    ]
  }
];
```

Create `tests/core/treeModel.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm test -- tests/core/treeModel.test.ts
```

Expected: FAIL because `src/core/treeModel.ts` does not exist.

- [ ] **Step 3: Implement shared types and tree model**

Create `src/core/types.ts`:

```ts
export interface BookmarkTreeNode {
  id: string;
  title: string;
  url?: string;
  dateAdded?: number;
  children?: BookmarkTreeNode[];
}

export interface IndexedBookmark {
  id: string;
  title: string;
  url: string;
  dateAdded?: number;
  parentId?: string;
  path: string[];
}

export interface IndexedFolder {
  id: string;
  title: string;
  parentId?: string;
  path: string[];
}

export interface BookmarkIndex {
  bookmarks: IndexedBookmark[];
  folders: IndexedFolder[];
  byId: Map<string, IndexedBookmark | IndexedFolder>;
}

export interface BackupRecord {
  id: string;
  createdAt: string;
  extensionVersion: string;
  tree: BookmarkTreeNode[];
}

export type DuplicateConfidence = "low-risk" | "medium-risk" | "low-confidence";

export interface DuplicateCandidate {
  id: string;
  title: string;
  url: string;
  normalizedUrl: string;
  path: string[];
  dateAdded?: number;
  action: "keep" | "delete" | "review";
}

export interface DuplicateGroup {
  key: string;
  confidence: DuplicateConfidence;
  reason: string;
  candidates: DuplicateCandidate[];
}

export interface ClassificationProposal {
  bookmarkId: string;
  title: string;
  url: string;
  sourcePath: string[];
  destinationFolderTitle: string;
  destinationFolderId?: string;
  confidence: number;
  reason: string;
}

export interface OperationRecord {
  id: string;
  type: "backup" | "duplicate-cleanup" | "classification" | "restore";
  createdAt: string;
  backupId?: string;
  summary: string;
  details: unknown;
}
```

Create `src/core/treeModel.ts`:

```ts
import type {
  BookmarkIndex,
  BookmarkTreeNode,
  IndexedBookmark,
  IndexedFolder
} from "./types";

export function buildBookmarkIndex(tree: BookmarkTreeNode[]): BookmarkIndex {
  const bookmarks: IndexedBookmark[] = [];
  const folders: IndexedFolder[] = [];
  const byId = new Map<string, IndexedBookmark | IndexedFolder>();

  function visit(node: BookmarkTreeNode, parentId: string | undefined, path: string[]) {
    if (node.url) {
      const bookmark: IndexedBookmark = {
        id: node.id,
        title: node.title,
        url: node.url,
        dateAdded: node.dateAdded,
        parentId,
        path
      };
      bookmarks.push(bookmark);
      byId.set(node.id, bookmark);
      return;
    }

    const nextPath = node.title ? [...path, node.title] : path;
    if (node.title) {
      const folder: IndexedFolder = {
        id: node.id,
        title: node.title,
        parentId,
        path: nextPath
      };
      folders.push(folder);
      byId.set(node.id, folder);
    }

    for (const child of node.children ?? []) {
      visit(child, node.id, nextPath);
    }
  }

  for (const root of tree) {
    visit(root, undefined, []);
  }

  return { bookmarks, folders, byId };
}
```

- [ ] **Step 4: Run tree model tests**

Run:

```powershell
npm test -- tests/core/treeModel.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit tree model**

```powershell
git add src/core/types.ts src/core/treeModel.ts tests/fixtures/bookmarkTrees.ts tests/core/treeModel.test.ts
git commit -m "feat: add bookmark tree model"
```

## Task 3: URL Normalization

**Files:**
- Create: `src/core/urlNormalizer.ts`
- Create: `tests/core/urlNormalizer.test.ts`

- [ ] **Step 1: Write failing URL normalization tests**

Create `tests/core/urlNormalizer.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { normalizeUrl } from "../../src/core/urlNormalizer";

describe("normalizeUrl", () => {
  it("removes common tracking parameters and hash fragments", () => {
    expect(
      normalizeUrl("https://example.com/page?utm_source=x&gclid=abc&id=42#section")
    ).toBe("https://example.com/page?id=42");
  });

  it("normalizes host casing and removes trailing slashes from non-root paths", () => {
    expect(normalizeUrl("HTTPS://Example.COM/Docs/")).toBe("https://example.com/Docs");
  });

  it("returns the trimmed original value when URL parsing fails", () => {
    expect(normalizeUrl(" not a url ")).toBe("not a url");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm test -- tests/core/urlNormalizer.test.ts
```

Expected: FAIL because `src/core/urlNormalizer.ts` does not exist.

- [ ] **Step 3: Implement URL normalizer**

Create `src/core/urlNormalizer.ts`:

```ts
const TRACKING_PARAMS = new Set([
  "fbclid",
  "gclid",
  "igshid",
  "mc_cid",
  "mc_eid",
  "mkt_tok",
  "ref",
  "spm"
]);

export function normalizeUrl(input: string): string {
  const trimmed = input.trim();

  try {
    const url = new URL(trimmed);
    url.protocol = url.protocol.toLowerCase();
    url.hostname = url.hostname.toLowerCase();
    url.hash = "";

    for (const key of Array.from(url.searchParams.keys())) {
      if (key.toLowerCase().startsWith("utm_") || TRACKING_PARAMS.has(key.toLowerCase())) {
        url.searchParams.delete(key);
      }
    }

    let normalized = url.toString();
    if (url.searchParams.size === 0) {
      normalized = normalized.replace(/\?$/, "");
    }
    if (url.pathname !== "/" && normalized.endsWith("/")) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    return trimmed;
  }
}
```

- [ ] **Step 4: Run URL normalization tests**

Run:

```powershell
npm test -- tests/core/urlNormalizer.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit URL normalizer**

```powershell
git add src/core/urlNormalizer.ts tests/core/urlNormalizer.test.ts
git commit -m "feat: normalize bookmark urls"
```

## Task 4: Duplicate Detection Engine

**Files:**
- Create: `src/core/duplicateEngine.ts`
- Create: `tests/core/duplicateEngine.test.ts`

- [ ] **Step 1: Write failing duplicate engine tests**

Create `tests/core/duplicateEngine.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { findDuplicateGroups } from "../../src/core/duplicateEngine";
import type { IndexedBookmark } from "../../src/core/types";

const bookmarks: IndexedBookmark[] = [
  {
    id: "a",
    title: "OpenAI",
    url: "https://openai.com/?utm_source=newsletter",
    dateAdded: 100,
    path: ["Bookmarks Bar"]
  },
  {
    id: "b",
    title: "OpenAI",
    url: "https://openai.com/",
    dateAdded: 200,
    path: ["Other Bookmarks"]
  },
  {
    id: "c",
    title: "OpenAI Docs",
    url: "https://openai.com/",
    dateAdded: 300,
    path: ["AI"]
  }
];

describe("findDuplicateGroups", () => {
  it("marks exact title and normalized URL matches as low-risk", () => {
    const groups = findDuplicateGroups(bookmarks);
    const exact = groups.find((group) => group.confidence === "low-risk");

    expect(exact?.candidates.map((candidate) => candidate.id)).toEqual(["a", "b"]);
    expect(exact?.candidates.find((candidate) => candidate.id === "a")?.action).toBe("keep");
    expect(exact?.candidates.find((candidate) => candidate.id === "b")?.action).toBe("delete");
  });

  it("marks same normalized URL with different title as medium-risk review", () => {
    const groups = findDuplicateGroups(bookmarks);
    const medium = groups.find((group) => group.confidence === "medium-risk");

    expect(medium?.candidates.map((candidate) => candidate.action)).toEqual(["review", "review", "review"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm test -- tests/core/duplicateEngine.test.ts
```

Expected: FAIL because `findDuplicateGroups` does not exist.

- [ ] **Step 3: Implement duplicate engine**

Create `src/core/duplicateEngine.ts`:

```ts
import type {
  DuplicateCandidate,
  DuplicateGroup,
  IndexedBookmark
} from "./types";
import { normalizeUrl } from "./urlNormalizer";

export function findDuplicateGroups(bookmarks: IndexedBookmark[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const byExact = new Map<string, IndexedBookmark[]>();
  const byUrl = new Map<string, IndexedBookmark[]>();

  for (const bookmark of bookmarks) {
    const normalizedUrl = normalizeUrl(bookmark.url);
    addToGroup(byExact, `${bookmark.title.trim().toLowerCase()}|${normalizedUrl}`, bookmark);
    addToGroup(byUrl, normalizedUrl, bookmark);
  }

  for (const [key, members] of byExact) {
    if (members.length < 2) continue;
    const keepId = chooseBookmarkToKeep(members).id;
    groups.push({
      key,
      confidence: "low-risk",
      reason: "标题和规范化 URL 完全一致",
      candidates: members.map((bookmark) => toCandidate(bookmark, bookmark.id === keepId ? "keep" : "delete"))
    });
  }

  for (const [key, members] of byUrl) {
    if (members.length < 2) continue;
    const titles = new Set(members.map((bookmark) => bookmark.title.trim().toLowerCase()));
    if (titles.size === 1) continue;
    groups.push({
      key,
      confidence: "medium-risk",
      reason: "规范化 URL 相同，但标题不同，需要人工确认",
      candidates: members.map((bookmark) => toCandidate(bookmark, "review"))
    });
  }

  return groups;
}

function addToGroup(map: Map<string, IndexedBookmark[]>, key: string, bookmark: IndexedBookmark) {
  const existing = map.get(key) ?? [];
  existing.push(bookmark);
  map.set(key, existing);
}

function toCandidate(
  bookmark: IndexedBookmark,
  action: DuplicateCandidate["action"]
): DuplicateCandidate {
  return {
    id: bookmark.id,
    title: bookmark.title,
    url: bookmark.url,
    normalizedUrl: normalizeUrl(bookmark.url),
    path: bookmark.path,
    dateAdded: bookmark.dateAdded,
    action
  };
}

function chooseBookmarkToKeep(bookmarks: IndexedBookmark[]): IndexedBookmark {
  return [...bookmarks].sort((left, right) => {
    const leftScore = folderScore(left.path);
    const rightScore = folderScore(right.path);
    if (leftScore !== rightScore) return rightScore - leftScore;
    return (left.dateAdded ?? Number.MAX_SAFE_INTEGER) - (right.dateAdded ?? Number.MAX_SAFE_INTEGER);
  })[0];
}

function folderScore(path: string[]): number {
  const joined = path.join("/").toLowerCase();
  if (joined.includes("bookmarks bar")) return 3;
  if (path.length > 0) return 2;
  return 1;
}
```

- [ ] **Step 4: Run duplicate tests**

Run:

```powershell
npm test -- tests/core/duplicateEngine.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit duplicate engine**

```powershell
git add src/core/duplicateEngine.ts tests/core/duplicateEngine.test.ts
git commit -m "feat: detect duplicate bookmarks"
```

## Task 5: Classification Engine

**Files:**
- Create: `src/core/classificationEngine.ts`
- Create: `tests/core/classificationEngine.test.ts`

- [ ] **Step 1: Write failing classification tests**

Create `tests/core/classificationEngine.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm test -- tests/core/classificationEngine.test.ts
```

Expected: FAIL because `classificationEngine.ts` does not exist.

- [ ] **Step 3: Implement classification proposals**

Create `src/core/classificationEngine.ts`:

```ts
import type {
  BookmarkIndex,
  ClassificationProposal,
  IndexedBookmark,
  IndexedFolder
} from "./types";

const FALLBACK_CATEGORIES = [
  { title: "Development", tokens: ["github", "developer", "docs", "npm", "stackoverflow", "mdn"] },
  { title: "AI", tokens: ["openai", "claude", "ai", "model", "prompt"] },
  { title: "Learning", tokens: ["course", "learn", "tutorial", "docs", "blog"] },
  { title: "Work", tokens: ["mail", "calendar", "notion", "jira", "office"] },
  { title: "Shopping", tokens: ["shop", "cart", "order", "amazon", "taobao", "jd"] },
  { title: "Entertainment", tokens: ["youtube", "bilibili", "music", "game", "video"] },
  { title: "News", tokens: ["news", "daily", "article"] },
  { title: "Read Later", tokens: ["read", "later", "saved"] }
];

export function proposeClassifications(index: BookmarkIndex): ClassificationProposal[] {
  return index.bookmarks
    .map((bookmark) => proposeForBookmark(bookmark, index.folders))
    .filter((proposal): proposal is ClassificationProposal => proposal !== undefined);
}

function proposeForBookmark(
  bookmark: IndexedBookmark,
  folders: IndexedFolder[]
): ClassificationProposal | undefined {
  const haystack = `${bookmark.title} ${bookmark.url}`.toLowerCase();
  const existing = folders
    .map((folder) => ({
      folder,
      score: scoreFolder(folder, haystack)
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)[0];

  if (existing) {
    return {
      bookmarkId: bookmark.id,
      title: bookmark.title,
      url: bookmark.url,
      sourcePath: bookmark.path,
      destinationFolderId: existing.folder.id,
      destinationFolderTitle: existing.folder.title,
      confidence: Math.min(0.95, 0.55 + existing.score * 0.1),
      reason: `匹配已有文件夹「${existing.folder.title}」`
    };
  }

  const fallback = FALLBACK_CATEGORIES.find((category) =>
    category.tokens.some((token) => haystack.includes(token))
  );

  if (fallback) {
    return {
      bookmarkId: bookmark.id,
      title: bookmark.title,
      url: bookmark.url,
      sourcePath: bookmark.path,
      destinationFolderTitle: fallback.title,
      confidence: 0.62,
      reason: `匹配标准分类「${fallback.title}」`
    };
  }

  return {
    bookmarkId: bookmark.id,
    title: bookmark.title,
    url: bookmark.url,
    sourcePath: bookmark.path,
    destinationFolderTitle: "Unclassified",
    confidence: 0.3,
    reason: "没有明确匹配，放入未分类"
  };
}

function scoreFolder(folder: IndexedFolder, haystack: string): number {
  const words = folder.title
    .toLowerCase()
    .split(/[\s\-_/]+/)
    .filter(Boolean);
  return words.filter((word) => haystack.includes(word)).length;
}
```

- [ ] **Step 4: Run classification tests**

Run:

```powershell
npm test -- tests/core/classificationEngine.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit classification engine**

```powershell
git add src/core/classificationEngine.ts tests/core/classificationEngine.test.ts
git commit -m "feat: propose bookmark classifications"
```

## Task 6: Backup Serialization And Operation Logs

**Files:**
- Create: `src/core/backupSerializer.ts`
- Create: `src/core/operationLog.ts`
- Create: `tests/core/backupSerializer.test.ts`
- Create: `tests/core/operationLog.test.ts`

- [ ] **Step 1: Write failing backup serializer tests**

Create `tests/core/backupSerializer.test.ts`:

```ts
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
```

Create `tests/core/operationLog.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createOperationRecord } from "../../src/core/operationLog";

describe("createOperationRecord", () => {
  it("creates a timestamped operation record", () => {
    const record = createOperationRecord({
      type: "duplicate-cleanup",
      createdAt: "2026-05-13T00:00:00.000Z",
      backupId: "backup-1",
      summary: "Deleted 2 exact duplicates",
      details: { deletedIds: ["a", "b"] }
    });

    expect(record.id).toBe("operation-2026-05-13T00-00-00-000Z");
    expect(record.backupId).toBe("backup-1");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```powershell
npm test -- tests/core/backupSerializer.test.ts tests/core/operationLog.test.ts
```

Expected: FAIL because backup and log modules do not exist.

- [ ] **Step 3: Implement backup serializer**

Create `src/core/backupSerializer.ts`:

```ts
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
    const addDate = node.dateAdded ? Math.floor(node.dateAdded / 1000) : "";
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
```

- [ ] **Step 4: Implement operation log builder**

Create `src/core/operationLog.ts`:

```ts
import type { OperationRecord } from "./types";

export function createOperationRecord(input: Omit<OperationRecord, "id">): OperationRecord {
  return {
    ...input,
    id: `operation-${input.createdAt.replace(/[:.]/g, "-")}`
  };
}
```

- [ ] **Step 5: Run backup and log tests**

Run:

```powershell
npm test -- tests/core/backupSerializer.test.ts tests/core/operationLog.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit backup and logs**

```powershell
git add src/core/backupSerializer.ts src/core/operationLog.ts tests/core/backupSerializer.test.ts tests/core/operationLog.test.ts
git commit -m "feat: serialize bookmark backups"
```

## Task 7: Chrome Adapter And Background Workflows

**Files:**
- Create: `src/platform/chromeAdapter.ts`
- Modify: `src/background/index.ts`
- Create: `tests/core/workflowTypes.test.ts`

- [ ] **Step 1: Add message and workflow types**

Modify `src/core/types.ts` by appending:

```ts
export type ExtensionRequest =
  | { type: "scan" }
  | { type: "create-backup" }
  | { type: "cleanup-exact-duplicates"; bookmarkIds: string[] }
  | { type: "apply-classification"; moves: Array<{ bookmarkId: string; parentId: string }> }
  | { type: "export-backup"; backupId: string; format: "json" | "html" };

export type ExtensionResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export interface ScanResult {
  bookmarkCount: number;
  folderCount: number;
  duplicateGroups: DuplicateGroup[];
  classificationProposals: ClassificationProposal[];
  latestBackup?: BackupRecord;
}
```

- [ ] **Step 2: Create Chrome adapter**

Create `src/platform/chromeAdapter.ts`:

```ts
import type { BackupRecord, BookmarkTreeNode, OperationRecord } from "../core/types";

const BACKUPS_KEY = "bookmark-manager:backups";
const OPERATIONS_KEY = "bookmark-manager:operations";
const MAX_BACKUPS = 10;

export async function getBookmarkTree(): Promise<BookmarkTreeNode[]> {
  return chrome.bookmarks.getTree() as Promise<BookmarkTreeNode[]>;
}

export async function removeBookmark(id: string): Promise<void> {
  await chrome.bookmarks.remove(id);
}

export async function moveBookmark(id: string, parentId: string): Promise<void> {
  await chrome.bookmarks.move(id, { parentId });
}

export async function createFolder(parentId: string, title: string): Promise<chrome.bookmarks.BookmarkTreeNode> {
  return chrome.bookmarks.create({ parentId, title });
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
    [OPERATIONS_KEY]: [operation, ...operations].slice(0, 50)
  });
}

export async function downloadText(filename: string, contents: string, mimeType: string): Promise<void> {
  const url = `data:${mimeType};charset=utf-8,${encodeURIComponent(contents)}`;
  await chrome.downloads.download({ url, filename, saveAs: true });
}
```

- [ ] **Step 3: Replace background service worker with workflow router**

Modify `src/background/index.ts`:

```ts
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
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "Unknown extension error";
      sendResponse({ ok: false, error: message });
    });
  return true;
});

async function handleRequest(request: ExtensionRequest): Promise<unknown> {
  if (request.type === "scan") return scanBookmarks();
  if (request.type === "create-backup") return createAndStoreBackup();
  if (request.type === "cleanup-exact-duplicates") return cleanupExactDuplicates(request.bookmarkIds);
  if (request.type === "export-backup") return exportBackup(request.backupId, request.format);
  throw new Error(`Unsupported request type: ${(request as ExtensionRequest).type}`);
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
```

- [ ] **Step 4: Typecheck background workflow**

Run:

```powershell
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Build extension**

Run:

```powershell
npm run build
```

Expected: PASS and `dist/assets/background.js` exists.

- [ ] **Step 6: Commit background workflow**

```powershell
git add src/core/types.ts src/platform/chromeAdapter.ts src/background/index.ts
git commit -m "feat: add background bookmark workflows"
```

## Task 8: Options Page UI

**Files:**
- Modify: `src/options/options.ts`
- Modify: `src/options/options.css`

- [ ] **Step 1: Replace options page with tabbed UI**

Modify `src/options/options.ts`:

```ts
import type { ExtensionRequest, ExtensionResponse, ScanResult } from "../core/types";
import "./options.css";

const app = document.querySelector<HTMLDivElement>("#app");

let scanResult: ScanResult | undefined;
let activeTab: "overview" | "duplicates" | "classification" | "backups" = "overview";

render();
void refreshScan();

async function sendRequest<T>(request: ExtensionRequest): Promise<T> {
  const response = (await chrome.runtime.sendMessage(request)) as ExtensionResponse<T>;
  if (!response.ok) throw new Error(response.error);
  return response.data;
}

async function refreshScan() {
  scanResult = await sendRequest<ScanResult>({ type: "scan" });
  render();
}

function render() {
  if (!app) return;

  app.innerHTML = `
    <section class="page">
      <header class="header">
        <div>
          <h1>Bookmark Manager</h1>
          <p>本地整理 Chrome 书签，先备份再清理。</p>
        </div>
        <button id="refresh" type="button">重新扫描</button>
      </header>
      <nav class="tabs">
        ${tabButton("overview", "概览")}
        ${tabButton("duplicates", "重复清理")}
        ${tabButton("classification", "自动分类")}
        ${tabButton("backups", "备份恢复")}
      </nav>
      <section class="panel">${renderPanel()}</section>
    </section>
  `;

  document.querySelector("#refresh")?.addEventListener("click", () => void refreshScan());
  document.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      activeTab = button.dataset.tab as typeof activeTab;
      render();
    });
  });
  document.querySelector("#cleanup-exact")?.addEventListener("click", () => void cleanupExact());
  document.querySelector("#create-backup")?.addEventListener("click", () => void createBackup());
  document.querySelector("#export-json")?.addEventListener("click", () => void exportLatest("json"));
  document.querySelector("#export-html")?.addEventListener("click", () => void exportLatest("html"));
}

function tabButton(id: typeof activeTab, label: string) {
  return `<button class="${activeTab === id ? "active" : ""}" data-tab="${id}" type="button">${label}</button>`;
}

function renderPanel() {
  if (!scanResult) return "<p>正在扫描书签...</p>";
  if (activeTab === "overview") return renderOverview();
  if (activeTab === "duplicates") return renderDuplicates();
  if (activeTab === "classification") return renderClassification();
  return renderBackups();
}

function renderOverview() {
  return `
    <div class="stats">
      <article><strong>${scanResult?.bookmarkCount ?? 0}</strong><span>书签</span></article>
      <article><strong>${scanResult?.folderCount ?? 0}</strong><span>文件夹</span></article>
      <article><strong>${scanResult?.duplicateGroups.length ?? 0}</strong><span>重复组</span></article>
      <article><strong>${scanResult?.classificationProposals.length ?? 0}</strong><span>分类建议</span></article>
    </div>
  `;
}

function renderDuplicates() {
  const exact = scanResult?.duplicateGroups.filter((group) => group.confidence === "low-risk") ?? [];
  const deleteIds = exact.flatMap((group) =>
    group.candidates.filter((candidate) => candidate.action === "delete").map((candidate) => candidate.id)
  );

  return `
    <div class="toolbar">
      <button id="cleanup-exact" type="button" ${deleteIds.length === 0 ? "disabled" : ""}>
        备份并自动删除 ${deleteIds.length} 个完全重复项
      </button>
    </div>
    ${exact.map(renderDuplicateGroup).join("") || "<p>没有发现可自动清理的完全重复书签。</p>"}
  `;
}

function renderDuplicateGroup(group: NonNullable<ScanResult["duplicateGroups"]>[number]) {
  return `
    <article class="group">
      <h2>${group.reason}</h2>
      <table>
        <thead><tr><th>动作</th><th>标题</th><th>URL</th><th>路径</th></tr></thead>
        <tbody>
          ${group.candidates
            .map(
              (candidate) => `
                <tr>
                  <td>${candidate.action}</td>
                  <td>${escapeHtml(candidate.title)}</td>
                  <td>${escapeHtml(candidate.url)}</td>
                  <td>${escapeHtml(candidate.path.join(" / "))}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </article>
  `;
}

function renderClassification() {
  const rows = scanResult?.classificationProposals ?? [];
  return `
    <table>
      <thead><tr><th>标题</th><th>来源</th><th>目标分类</th><th>原因</th></tr></thead>
      <tbody>
        ${rows
          .map(
            (row) => `
              <tr>
                <td>${escapeHtml(row.title)}</td>
                <td>${escapeHtml(row.sourcePath.join(" / "))}</td>
                <td>${escapeHtml(row.destinationFolderTitle)}</td>
                <td>${escapeHtml(row.reason)}</td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderBackups() {
  const latest = scanResult?.latestBackup;
  return `
    <div class="toolbar">
      <button id="create-backup" type="button">立即备份</button>
      <button id="export-json" type="button" ${latest ? "" : "disabled"}>导出 JSON</button>
      <button id="export-html" type="button" ${latest ? "" : "disabled"}>导出 HTML</button>
    </div>
    <p>${latest ? `最近备份：${latest.createdAt}` : "还没有备份。"}</p>
  `;
}

async function cleanupExact() {
  const ids =
    scanResult?.duplicateGroups
      .filter((group) => group.confidence === "low-risk")
      .flatMap((group) =>
        group.candidates.filter((candidate) => candidate.action === "delete").map((candidate) => candidate.id)
      ) ?? [];
  if (ids.length === 0) return;
  await sendRequest({ type: "cleanup-exact-duplicates", bookmarkIds: ids });
  await refreshScan();
}

async function createBackup() {
  await sendRequest({ type: "create-backup" });
  await refreshScan();
}

async function exportLatest(format: "json" | "html") {
  const backupId = scanResult?.latestBackup?.id;
  if (!backupId) return;
  await sendRequest({ type: "export-backup", backupId, format });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
```

- [ ] **Step 2: Add options page styles**

Modify `src/options/options.css`:

```css
body {
  margin: 0;
  font-family: Arial, "Microsoft YaHei", sans-serif;
  background: #f5f7fb;
  color: #1f2937;
}

button {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #ffffff;
  color: #111827;
  cursor: pointer;
  font: inherit;
  padding: 8px 12px;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 32px;
}

.header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.header h1 {
  margin: 0 0 6px;
}

.header p {
  margin: 0;
  color: #64748b;
}

.tabs {
  display: flex;
  gap: 8px;
  margin: 24px 0 16px;
}

.tabs .active {
  background: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
}

.panel {
  background: #ffffff;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  padding: 20px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.stats article {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
}

.stats strong {
  display: block;
  font-size: 28px;
}

.stats span {
  color: #64748b;
}

.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.group {
  border-top: 1px solid #e2e8f0;
  padding-top: 16px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border-bottom: 1px solid #e2e8f0;
  padding: 10px;
  text-align: left;
  vertical-align: top;
}

th {
  background: #f8fafc;
}
```

- [ ] **Step 3: Run typecheck and build**

Run:

```powershell
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit options UI**

```powershell
git add src/options/options.ts src/options/options.css
git commit -m "feat: add bookmark manager options ui"
```

## Task 9: Classification Apply, Restore, And Scheduled Backup

**Files:**
- Modify: `src/platform/chromeAdapter.ts`
- Modify: `src/background/index.ts`
- Modify: `src/options/options.ts`

- [ ] **Step 1: Add adapter functions for restore and folder lookup**

Modify `src/platform/chromeAdapter.ts` by adding:

```ts
export async function removeTree(id: string): Promise<void> {
  await chrome.bookmarks.removeTree(id);
}

export async function createBookmark(input: {
  parentId: string;
  title: string;
  url?: string;
  index?: number;
}): Promise<chrome.bookmarks.BookmarkTreeNode> {
  return chrome.bookmarks.create(input);
}
```

- [ ] **Step 2: Extend request types**

Modify `src/core/types.ts` by changing `ExtensionRequest` to include restore:

```ts
export type ExtensionRequest =
  | { type: "scan" }
  | { type: "create-backup" }
  | { type: "cleanup-exact-duplicates"; bookmarkIds: string[] }
  | { type: "apply-classification"; moves: Array<{ bookmarkId: string; parentId: string }> }
  | { type: "export-backup"; backupId: string; format: "json" | "html" }
  | { type: "restore-backup"; backupId: string };
```

- [ ] **Step 3: Wire alarm backup and restore placeholder workflow**

Modify `src/background/index.ts` imports to include:

```ts
import {
  createBookmark,
  createFolder,
  downloadText,
  getBackups,
  getBookmarkTree,
  moveBookmark,
  removeBookmark,
  saveBackup,
  saveOperation
} from "../platform/chromeAdapter";
```

Add after the message listener:

```ts
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "bookmark-manager-daily-backup") {
    void createAndStoreBackup();
  }
});
```

Update `handleRequest`:

```ts
async function handleRequest(request: ExtensionRequest): Promise<unknown> {
  if (request.type === "scan") return scanBookmarks();
  if (request.type === "create-backup") return createAndStoreBackup();
  if (request.type === "cleanup-exact-duplicates") return cleanupExactDuplicates(request.bookmarkIds);
  if (request.type === "apply-classification") return applyClassification(request.moves);
  if (request.type === "export-backup") return exportBackup(request.backupId, request.format);
  if (request.type === "restore-backup") return restoreBackup(request.backupId);
  throw new Error(`Unsupported request type: ${(request as ExtensionRequest).type}`);
}
```

Add these functions:

```ts
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
      note: "Full destructive restore is intentionally deferred until manual verification confirms Chrome root behavior."
    }
  });
  await saveOperation(operation);
  return operation;
}
```

- [ ] **Step 4: Add restore button to backups UI**

Modify the `renderBackups` function in `src/options/options.ts`:

```ts
function renderBackups() {
  const latest = scanResult?.latestBackup;
  return `
    <div class="toolbar">
      <button id="create-backup" type="button">立即备份</button>
      <button id="export-json" type="button" ${latest ? "" : "disabled"}>导出 JSON</button>
      <button id="export-html" type="button" ${latest ? "" : "disabled"}>导出 HTML</button>
      <button id="restore-latest" type="button" ${latest ? "" : "disabled"}>恢复最近备份</button>
    </div>
    <p>${latest ? `最近备份：${latest.createdAt}` : "还没有备份。"}</p>
  `;
}
```

Add event binding in `render()`:

```ts
document.querySelector("#restore-latest")?.addEventListener("click", () => void restoreLatest());
```

Add function:

```ts
async function restoreLatest() {
  const backupId = scanResult?.latestBackup?.id;
  if (!backupId) return;
  const confirmed = window.confirm("恢复是高风险操作。当前版本会先记录恢复请求并保留安全备份。继续？");
  if (!confirmed) return;
  await sendRequest({ type: "restore-backup", backupId });
  await refreshScan();
}
```

- [ ] **Step 5: Run verification**

Run:

```powershell
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit classification and restore workflow**

```powershell
git add src/core/types.ts src/platform/chromeAdapter.ts src/background/index.ts src/options/options.ts
git commit -m "feat: add classification and backup actions"
```

## Task 10: Manual Verification Documentation

**Files:**
- Create: `docs/manual-verification.md`

- [ ] **Step 1: Create manual verification checklist**

Create `docs/manual-verification.md`:

```md
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
4. Select `C:\Users\33002\Desktop\bookmark\dist`.
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
```

- [ ] **Step 2: Run final verification**

Run:

```powershell
npm test
npm run typecheck
npm run build
```

Expected: all commands pass.

- [ ] **Step 3: Commit docs**

```powershell
git add docs/manual-verification.md
git commit -m "docs: add manual verification checklist"
```

## Plan Self-Review

Spec coverage:

- Chrome Manifest V3 shell: Task 1.
- Bookmark reading and scan: Tasks 2 and 7.
- Backups in extension storage: Tasks 6 and 7.
- JSON and HTML export: Tasks 6 and 7.
- Duplicate detection and low-risk auto-delete: Tasks 3, 4, and 7.
- Similar duplicate review: Task 4 exposes medium-risk groups; Task 8 displays review tables.
- Hybrid classification: Task 5 and Task 8.
- Preview before classification: Task 8 displays proposals. Task 9 adds apply plumbing.
- Operation log: Tasks 6, 7, and 9.
- Scheduled backups: Tasks 1 and 9.
- Restore flow: Task 9 creates a conservative restore request flow and safety backup.
- Tests and manual verification: Tasks 2 through 6 and Task 10.

Known implementation boundary:

- Full destructive restore is deliberately conservative in the first implementation pass. The plan records restore requests and creates a safety backup, then requires manual Chrome root behavior verification before deleting and rebuilding real bookmark roots. This preserves the design's safety priority while avoiding accidental profile-wide data loss during early development.

Placeholder scan:

- The plan contains no unresolved placeholders or open-ended implementation prompts.
- Each code-writing step includes concrete code and command expectations.

Type consistency:

- Shared request, response, scan, duplicate, classification, backup, and operation types are defined before later modules import them.
- Background messages use the same request strings defined in `ExtensionRequest`.
