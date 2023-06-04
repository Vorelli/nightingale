import { appWithExtras } from "../types/types";
import {
    generateNextQueue,
    generatePreviousQueue,
    randomIndexFromQueue,
    setQueue
} from "./queue";

describe("queue", () => {
    let app: appWithExtras;
    let queue: Array<number>;

    beforeEach(() => {
        queue = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        app = {
            locals: { md5s: queue }
        } as unknown as appWithExtras;
        setQueue(app, queue);
    });

    it("should set the queue to what is passed in", () => {
        setQueue(app, [1, 2, 3]);
        expect(app.locals.queues).toStrictEqual([[1, 2, 3]]);
        expect(app.locals.queueIndex).toBe(0);
    });

    it("should generate random indexes in the last 25% of the queue", () => {
        const queue = [0, 1, 2, 3, 4];
        const randoms = new Array(5).fill(0);
        let num = 1000;
        for (let i = 0; i < num; i++) {
            randoms[randomIndexFromQueue(queue)]++;
        }
        expect(
            randoms.reduce(
                (acc, r, i) =>
                    acc === false
                        ? acc
                        : i < Math.floor(0.75 * queue.length)
                        ? r === 0
                        : Math.abs(num / Math.ceil(0.25 * queue.length) - r) <=
                          (num / Math.ceil(0.25 * queue.length)) * 0.15,
                true
            )
        ).toBe(true);
    });

    it("should generate random indexes in the last 25% of the queue", () => {
        const randoms = new Array(queue.length).fill(0);
        let num = 1000;
        for (let i = 0; i < num; i++) {
            randoms[randomIndexFromQueue(queue)]++;
        }
        expect(
            randoms.reduce(
                (acc, r, i) =>
                    acc === false
                        ? acc
                        : i < Math.floor(0.75 * queue.length)
                        ? r === 0
                        : Math.abs(num / Math.ceil(0.25 * queue.length) - r) <=
                          (num / Math.ceil(0.25 * queue.length)) * 0.15,
                true
            )
        ).toBe(true);
    });

    it("should generate the next queue in a decent fashion", () => {
        for (let i = 0; i < 5; i++) {
            generateNextQueue(app);
            const firstItem = app.locals.queues[app.locals.queueIndex + 1][0];
            expect(firstItem).not.toBe(i + 1);
            app.locals.queueIndex++;
        }
    });

    it("should generate the previous queue in a decent fashion", () => {
        const randoms = new Array(queue.length).fill(0);
        for (let i = 0; i < 1000; i++) {
            generatePreviousQueue(app);
            const firstItem = app.locals.queues[
                app.locals.queueIndex - 1
            ][0] as unknown as number;
            randoms[firstItem - 1]++;
            app.locals.queueIndex--;
        }
        console.log("randoms for prev:", randoms);
        randoms.forEach((num, _i) => {
            expect(
                Math.abs(1000 / queue.length - num) <=
                    (0.15 * 1000) / queue.length
            ).toBe(true);
        });
    });

    it("should increase the queue index and if it's at the end, generateNextQeue", () => {});
});
