import { loadSongs } from "./loadSongs";
import { firstRun } from "../server";
import { dbMigrate } from "../db/schema";
import path from "path";

describe("loadSongs", () => {
  it("should work", async () => {
    const filePath = path.resolve(__dirname, "../../../");
    console.log("path:", __dirname, filePath);
    let [app] = await firstRun(filePath);
    let [db, pool] = await dbMigrate(filePath);
    expect(loadSongs(app, db)).toBe(true);
  });
});
