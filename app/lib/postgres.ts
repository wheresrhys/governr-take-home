import { Pool, QueryResultRow } from "pg";
import { risk_severity } from "@/types/postgres";

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

export type ModelRiskFlatRow = {
  model_id: number;
  model_name: string;
  owner_name: string;
  risk_category_name: string | null;
  context_name: string | null;
  severity: risk_severity | null;
};

export async function fetchModels(orgId: number): Promise<ModelRiskFlatRow[]> {
  if (orgId === undefined || orgId === null) {
    throw new InvalidInputError("orgId is required");
  }

  const result = await pool.query<ModelRiskFlatRow>(
    `SELECT
       models.id AS model_id,
       models.name AS model_name,
       owners.name AS owner_name,
       risk_categories.name AS risk_category_name,
       contexts.name AS context_name,
       model_risks.severity AS severity
     FROM models
     JOIN owners ON owners.id = models.owner_id
     LEFT JOIN model_risks ON model_risks.model_id = models.id
     LEFT JOIN risk_categories ON risk_categories.id = model_risks.risk_category_id
     LEFT JOIN contexts ON contexts.id = model_risks.context_id
     WHERE models.org_id = $1
     ORDER BY models.id`,
    [orgId]
  );
  return result.rows;
}
