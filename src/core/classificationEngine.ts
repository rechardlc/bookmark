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

const TOKEN_ALIASES = new Map([
  ["openai", ["ai"]],
  ["claude", ["ai"]]
]);

export function proposeClassifications(index: BookmarkIndex): ClassificationProposal[] {
  return index.bookmarks
    .map((bookmark) => proposeForBookmark(bookmark, index.folders))
    .filter((proposal): proposal is ClassificationProposal => proposal !== undefined);
}

function proposeForBookmark(
  bookmark: IndexedBookmark,
  folders: IndexedFolder[]
): ClassificationProposal | undefined {
  const tokens = tokenizeBookmark(bookmark);
  const existing = folders
    .map((folder) => ({
      folder,
      score: scoreFolder(folder, tokens)
    }))
    .filter((item) => item.score > 0 && item.folder.id !== bookmark.parentId)
    .sort(compareFolderScores)[0];

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
    category.tokens.some((token) => tokens.has(token))
  );

  if (fallback) {
    const sameTitleFolders = folders.filter(
      (folder) => folder.title.toLowerCase() === fallback.title.toLowerCase()
    );
    const matchingFolder = sameTitleFolders
      .filter((folder) => folder.id !== bookmark.parentId)
      .sort(compareFolders)[0];

    if (sameTitleFolders.length > 0 && !matchingFolder) {
      return undefined;
    }

    return {
      bookmarkId: bookmark.id,
      title: bookmark.title,
      url: bookmark.url,
      sourcePath: bookmark.path,
      destinationFolderId: matchingFolder?.id,
      destinationFolderTitle: matchingFolder?.title ?? fallback.title,
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

function tokenizeBookmark(bookmark: IndexedBookmark): Set<string> {
  const tokens = tokenize(`${bookmark.title} ${bookmark.url}`);

  for (const token of Array.from(tokens)) {
    for (const alias of TOKEN_ALIASES.get(token) ?? []) {
      tokens.add(alias);
    }
  }

  return tokens;
}

function tokenize(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
  );
}

function scoreFolder(folder: IndexedFolder, tokens: Set<string>): number {
  const words = folder.title
    .toLowerCase()
    .split(/[\s\-_/]+/)
    .filter(Boolean);
  return words.filter((word) => tokens.has(word)).length;
}

function compareFolderScores(
  left: { folder: IndexedFolder; score: number },
  right: { folder: IndexedFolder; score: number }
): number {
  return right.score - left.score || compareFolders(left.folder, right.folder);
}

function compareFolders(left: IndexedFolder, right: IndexedFolder): number {
  return left.title.localeCompare(right.title) || left.id.localeCompare(right.id);
}
