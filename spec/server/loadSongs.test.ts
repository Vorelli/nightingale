import { expect, describe, it } from "@jest/globals";
import { loadSongs } from "../../dist/helpers/loadSongs";
import { app } from "../../src/server/server";

describe("loadSongs", () => {
  it("should work", () => {
    expect(loadSongs(app)).toBe(true);
  });
});
