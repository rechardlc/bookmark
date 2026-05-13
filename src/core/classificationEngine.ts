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
    const matchingFolder = folders.find((folder) => folder.title === fallback.title);

    return {
      bookmarkId: bookmark.id,
      title: bookmark.title,
      url: bookmark.url,
      sourcePath: bookmark.path,
      destinationFolderId: matchingFolder?.id,
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
