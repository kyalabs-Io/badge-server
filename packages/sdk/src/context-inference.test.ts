import { describe, expect, it } from "vitest";
import { inferContextFromUrl } from "./context-inference.js";

describe("inferContextFromUrl", () => {
  it("returns addtocart for cart URLs", () => {
    expect(inferContextFromUrl("https://shop.test/cart")).toBe("addtocart");
  });

  it("returns checkout for checkout URLs", () => {
    expect(inferContextFromUrl("https://shop.test/checkout/start")).toBe("checkout");
  });

  it("returns arrival for non-cart URLs", () => {
    expect(inferContextFromUrl("https://shop.test/products/widget")).toBe("arrival");
  });

  it("returns arrival for malformed URLs", () => {
    expect(inferContextFromUrl("not a valid url")).toBe("arrival");
  });
});
