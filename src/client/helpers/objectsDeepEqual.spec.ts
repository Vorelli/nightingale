import { objectsDeepEqual } from "./objectsDeepEqual";

describe("objectsDeepEqual", () => {
    it("should say two media metadata are the same when every key matches", () => {
        const a = {
            album: "hello",
            artist: "hello",
            title: "hello",
            artwork: [
                {
                    sizes: "19x19",
                    src: "hello.jpg",
                    type: "image/hello"
                }
            ]
        };
        const b = {
            album: "hello",
            artist: "hello",
            title: "hello",
            artwork: [
                {
                    sizes: "19x19",
                    src: "hello.jpg",
                    type: "image/hello"
                }
            ]
        };
        expect(objectsDeepEqual(a, b)).toBe(true);
    });

    it("should return false when they're different", () => {
        const a = {
            b: true
        };
        const b = {
            b: false
        };
        const c = {
            a: true
        };
        expect(objectsDeepEqual(a, b)).toBe(false);
        expect(objectsDeepEqual(a, c)).toBe(false);
        expect(objectsDeepEqual(c, b)).toBe(false);
    });
});
