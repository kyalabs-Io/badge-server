import { describe, expect, it } from "vitest";
import {
  BADGE_VERSION,
  inferContextFromUrl,
  postDeclareVisit,
  postReportOutcome,
} from "./index.js";

describe("sdk exports", () => {
  it("exports the X1 lifecycle helpers", () => {
    expect(typeof inferContextFromUrl).toBe("function");
    expect(typeof postDeclareVisit).toBe("function");
    expect(typeof postReportOutcome).toBe("function");
  });

  it("exports BADGE_VERSION as a string", () => {
    expect(typeof BADGE_VERSION).toBe("string");
    expect(BADGE_VERSION).toBe("2.4");
  });
});
