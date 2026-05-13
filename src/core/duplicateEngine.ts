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
      candidates: members.map((bookmark) =>
        toCandidate(bookmark, bookmark.id === keepId ? "keep" : "delete")
      )
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
