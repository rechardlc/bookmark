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
