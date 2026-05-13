import type { OperationRecord } from "./types";

export function createOperationRecord(input: Omit<OperationRecord, "id">): OperationRecord {
  return {
    ...input,
    id: `operation-${input.createdAt.replace(/[:.]/g, "-")}`
  };
}
