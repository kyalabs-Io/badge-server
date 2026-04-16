import { describe, expect, it } from "vitest";
import {
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
});
