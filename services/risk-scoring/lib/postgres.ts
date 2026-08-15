import { Pool, QueryResultRow } from "pg";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5433/governr";

export const pool = new Pool({ connectionString: DATABASE_URL });

export class InvalidInputError extends Error {}

const TABLE_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export async function getItems<T extends QueryResultRow = QueryResultRow>(
  tableName: string,
  orgId: number
): Promise<T[]> {
  if (!tableName || !TABLE_NAME_PATTERN.test(tableName)) {
    throw new InvalidInputError(
      "tableName is required and must be a valid identifier"
    );
  }
  if (orgId === undefined || orgId === null) {
    throw new InvalidInputError("orgId is required");
  }

  const result = await pool.query<T>(
    `SELECT * FROM "${tableName}" WHERE org_id IS NULL OR org_id = $1`,
    [orgId]
  );
  return result.rows;
}
