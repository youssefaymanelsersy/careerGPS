import { describe, it, expect } from "bun:test";

describe("sanity", () => {
  it("server module loads without throwing", () => {
    expect(1 + 1).toBe(2);
  });
});