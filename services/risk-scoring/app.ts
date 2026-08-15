import express from "express";
import { validateAssessRiskPayload } from "./schemas/assess-risk.schema";
import { requireAuth } from "./middleware/auth";

const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "hello world" });
});

app.post("/assess-risk", requireAuth, (req, res) => {
  if (!validateAssessRiskPayload(req.body)) {
    res.status(400).json({ errors: validateAssessRiskPayload.errors });
    return;
  }

  res.status(200).json({ received: true });
});

export default app;
