import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../app";

describe("POST /assess-risk", () => {
  it("returns 400 when the payload doesn't match the expected shape", async () => {
    const response = await request(app)
      .post("/assess-risk")
      .set("Authorization", "Bearer test-token")
      .send({ model: { id: 1, name: "test-model" } }); // missing `risks`

    expect(response.status).toBe(400);
  });

  it("returns 401 when no auth header is set", async () => {
    const response = await request(app)
      .post("/assess-risk")
      .send({ model: { id: 1, name: "test-model" }, risks: [] });

    expect(response.status).toBe(401);
  });
});
