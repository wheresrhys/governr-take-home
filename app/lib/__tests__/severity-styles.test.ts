import { describe, expect, it } from "vitest";
import { scoreColor, severityColor } from "../severity-styles";

describe("severityColor", () => {
  it("maps LOW to the yellow badge", () => {
    expect(severityColor("LOW").badgeClassName).toContain("amber");
  });

  it("maps MODERATE to the orange badge", () => {
    expect(severityColor("MODERATE").badgeClassName).toContain("orange");
  });

  it("maps HIGH to the red badge", () => {
    expect(severityColor("HIGH").badgeClassName).toContain("red");
  });
});

describe("scoreColor", () => {
  it("treats scores below 10 as yellow", () => {
    expect(scoreColor(9).badgeClassName).toContain("amber");
  });

  it("treats a score of 10 as orange", () => {
    expect(scoreColor(10).badgeClassName).toContain("orange");
  });

  it("treats a score of 99 as orange", () => {
    expect(scoreColor(99).badgeClassName).toContain("orange");
  });

  it("treats a score of 100 as red", () => {
    expect(scoreColor(100).badgeClassName).toContain("red");
  });
});
