import Ajv, { JSONSchemaType } from "ajv";
import type { risk_severity } from "../../../types/postgres.d.ts";

export interface AssessRiskPayload {
  org_id: number;
  model: {
    id: number;
    name: string;
  };
  risks: {
    risk_category: string;
    context: string;
    severity: risk_severity;
  }[];
}

// Hand-written mirror of db/schema/006_model_risks.sql's risk_severity enum
// and the models/risk_categories/contexts table shapes. In a more polished
// solution this schema (at least the severity enum) would be codegened
// straight from the DB schema, the same way types/postgres.d.ts is, rather
// than hand-duplicated here.
const assessRiskSchema: JSONSchemaType<AssessRiskPayload> = {
  type: "object",
  properties: {
    org_id: { type: "number" },
    model: {
      type: "object",
      properties: {
        id: { type: "number" },
        name: { type: "string" },
      },
      required: ["id", "name"],
      additionalProperties: false,
    },
    risks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          risk_category: { type: "string" },
          context: { type: "string" },
          severity: { type: "string", enum: ["LOW", "MODERATE", "HIGH"] },
        },
        required: ["risk_category", "context", "severity"],
        additionalProperties: false,
      },
    },
  },
  required: ["org_id", "model", "risks"],
  additionalProperties: false,
};

const ajv = new Ajv();

export const validateAssessRiskPayload = ajv.compile(assessRiskSchema);
