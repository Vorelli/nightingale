import { isAudio } from "./isAudio";
import fs from "fs";
import path from "path";

describe("isAudio", () => {
  it("should return false for non audio files", (done) => {
    const dirPath = path.resolve("samples/nonAudio");
    fs.readdir(dirPath, (err, files) => {
      expect(err).toBe(null);
      if (err) throw err;
      let filesRead = 0;
      files.forEach((filePath) => {
        fs.readFile(path.resolve(dirPath, filePath), (err, data) => {
          filesRead++;
          expect(err).toBe(null);
          console.log(data.slice(50));
          expect(isAudio(data)).toBe(false);
          if (filesRead === files.length) {
            done();
          }
        });
      });
    });
    expect(
      isAudio(
        Buffer.from("000000000000000000000000000000000000000000000000000000000")
      )
    ).toBe(false);
  });

  it("should return true for audio files", () => {});
});
