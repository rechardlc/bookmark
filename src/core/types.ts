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
