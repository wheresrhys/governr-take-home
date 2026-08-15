import { describe, expect, it, vi, beforeEach } from "vitest";

const { queryMock } = vi.hoisted(() => ({ queryMock: vi.fn() }));

vi.mock("pg", () => ({
  Pool: vi.fn(() => ({ query: queryMock })),
}));

import { getItems, InvalidInputError } from "../postgres";

describe("getItems", () => {
  beforeEach(() => {
    queryMock.mockReset();
    queryMock.mockResolvedValue({ rows: [] });
  });

  it("throws InvalidInputError when tableName is missing", async () => {
    await expect(getItems(undefined as unknown as string, 1)).rejects.toThrow(
      InvalidInputError
    );
  });

  it("throws InvalidInputError when orgId is missing", async () => {
    await expect(
      getItems("models", undefined as unknown as number)
    ).rejects.toThrow(InvalidInputError);
  });

  it("calls pg with the expected query", async () => {
    await getItems("models", 42);
    expect(queryMock).toHaveBeenCalledWith(
      'SELECT * FROM "models" WHERE org_id IS NULL OR org_id = $1',
      [42]
    );
  });
});
