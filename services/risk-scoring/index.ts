import express from "express";

const app = express();
const port = process.env.PORT || 4000;

app.get("/", (_req, res) => {
  res.json({ message: "hello world" });
});

app.listen(port, () => {
  console.log(`risk-scoring service listening on port ${port}`);
});
