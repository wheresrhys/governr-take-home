import { describe, expect, it, vi, beforeEach } from "vitest";

const { queryMock } = vi.hoisted(() => ({ queryMock: vi.fn() }));

vi.mock("pg", () => ({
  Pool: vi.fn(() => ({ query: queryMock })),
}));

import { getItems, fetchModels, InvalidInputError } from "../postgres";

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

describe("fetchModels", () => {
  beforeEach(() => {
    queryMock.mockReset();
    queryMock.mockResolvedValue({ rows: [] });
  });

  it("throws InvalidInputError when orgId is missing", async () => {
    await expect(
      fetchModels(undefined as unknown as number)
    ).rejects.toThrow(InvalidInputError);
  });

  it("calls pg with a query scoped to the org", async () => {
    await fetchModels(7);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("WHERE models.org_id = $1"),
      [7]
    );
  });

  it("returns the rows from the query", async () => {
    const rows = [
      {
        model_id: 1,
        model_name: "A",
        owner_name: "Bob",
        risk_category_name: null,
        context_name: null,
        severity: null,
      },
    ];
    queryMock.mockResolvedValueOnce({ rows });
    await expect(fetchModels(7)).resolves.toEqual(rows);
  });
});
