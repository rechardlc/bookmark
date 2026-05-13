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
