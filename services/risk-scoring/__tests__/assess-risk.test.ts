import { describe, expect, it, vi, beforeEach } from "vitest";
import request from "supertest";

const { getItemsMock } = vi.hoisted(() => ({ getItemsMock: vi.fn() }));

vi.mock("../lib/postgres", () => ({ getItems: getItemsMock }));

import app from "../app";

const RISK_CATEGORIES = [{ id: 1, name: "Bias", org_id: null }];
const CONTEXTS = [{ id: 1, name: "Production", org_id: null }];

const validPayload = {
  org_id: 1,
  model: { id: 1, name: "test-model" },
  risks: [{ risk_category: "Bias", context: "Production", severity: "LOW" }],
};

describe("POST /assess-risk", () => {
  beforeEach(() => {
    getItemsMock.mockReset();
    getItemsMock.mockImplementation((tableName: string) =>
      Promise.resolve(tableName === "risk_categories" ? RISK_CATEGORIES : CONTEXTS)
    );
  });

  it("returns 400 when the payload doesn't match the expected shape", async () => {
    const response = await request(app)
      .post("/assess-risk")
      .set("x-api-key", "test-key")
      .send({ model: { id: 1, name: "test-model" } }); // missing `risks`

    expect(response.status).toBe(400);
  });

  it("returns 401 when no auth header is set", async () => {
    const response = await request(app)
      .post("/assess-risk")
      .send({ model: { id: 1, name: "test-model" }, risks: [] });

    expect(response.status).toBe(401);
  });

  it("returns 200 when the payload references known categories and contexts", async () => {
    const response = await request(app)
      .post("/assess-risk")
      .set("x-api-key", "test-key")
      .send(validPayload);

    expect(response.status).toBe(200);
  });

  it("returns 400 listing the risk category when it doesn't exist in the DB", async () => {
    const response = await request(app)
      .post("/assess-risk")
      .set("x-api-key", "test-key")
      .send({
        ...validPayload,
        risks: [{ risk_category: "Not A Real Category", context: "Production", severity: "LOW" }],
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("Not A Real Category");
  });

  it("returns 400 listing the context when it doesn't exist in the DB", async () => {
    const response = await request(app)
      .post("/assess-risk")
      .set("x-api-key", "test-key")
      .send({
        ...validPayload,
        risks: [{ risk_category: "Bias", context: "Not A Real Context", severity: "LOW" }],
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("Not A Real Context");
  });

  it("returns aggregateRiskScore summing 100 per high, 10 per moderate, 1 per low risk", async () => {
    const response = await request(app)
      .post("/assess-risk")
      .set("x-api-key", "test-key")
      .send({
        ...validPayload,
        risks: [
          { risk_category: "Bias", context: "Production", severity: "HIGH" },
          { risk_category: "Bias", context: "Production", severity: "MODERATE" },
          { risk_category: "Bias", context: "Production", severity: "MODERATE" },
          { risk_category: "Bias", context: "Production", severity: "LOW" },
          { risk_category: "Bias", context: "Production", severity: "LOW" },
          { risk_category: "Bias", context: "Production", severity: "LOW" },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      model: { id: 1, name: "test-model" },
      aggregateRiskScore: 123,
    });
  });

  it("returns 502 when a db call fails", async () => {
    getItemsMock.mockRejectedValue(new Error("connection refused"));

    const response = await request(app)
      .post("/assess-risk")
      .set("x-api-key", "test-key")
      .send(validPayload);

    expect(response.status).toBe(502);
  });
});
