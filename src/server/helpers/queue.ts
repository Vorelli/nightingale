import { appWithExtras } from "../types/types.js";
import sqlite3 from "sqlite3";
//const smDb = new sqlite3.Database("../persist.db", sqlite3.OPEN_READWRITE);

export function initializeQueue(app: appWithExtras) {
    //smDb.all();
    setQueue(app, shuffle(app.locals.md5s));
    app.locals.status = "PLAYING";
    generateNextQueue(app);
    generatePreviousQueue(app);
}

export function setQueue(app: appWithExtras, queue: any[]) {
    app.locals.queues = [queue];
    app.locals.queueIndex = 0;
}

export function randomIndexFromQueue(queue: any[]): number {
    const add = Math.floor(queue.length * 0.75);
    return Math.floor(add + Math.random() * Math.ceil(queue.length * 0.25));
}

export function generateNextQueue(app: appWithExtras) {
    if (app.locals.md5s.length > 0) {
        const newQueue = app.locals.queues[app.locals.queueIndex].slice();
        switch (app.locals.shuffleBy) {
            default:
                const first = newQueue.shift();
                if (first === undefined)
                    throw new Error(
                        "trying to generate new previous queue and first is undefined!"
                    );
                newQueue.splice(randomIndexFromQueue(newQueue) + 1, 0, first);
        }
        app.locals.queues.push(newQueue);
    }
}

export function generatePreviousQueue(app: appWithExtras) {
    if (app.locals.md5s.length > 0) {
        const newQueue = app.locals.queues[app.locals.queueIndex].slice();
        switch (app.locals.shuffleBy) {
            default:
                const random = newQueue.splice(
                    randomIndexFromQueue(newQueue),
                    1
                )[0];
                if (random === undefined)
                    throw new Error(
                        "trying to generate new previous queue and random is undefined!"
                    );
                newQueue.splice(0, 0, random as string);
        }
        app.locals.queueIndex =
            (app.locals.queueIndex + 1) % (app.locals.queues.length + 1);
        app.locals.queues.unshift(newQueue);
    }
}

export function shuffle(arr: any[]) {
    return arr.sort(() => 0.5 - Math.random());
}

export function setTimeAndSend(app: appWithExtras, time: bigint) {
    app.locals.currentTime = time;
    sendSync(app);
}

export function nextSong(app: appWithExtras) {
    app.locals.queueIndex++;
    if (app.locals.queueIndex === app.locals.queues.length - 1) {
        generateNextQueue(app);
    }
    setTimeAndSend(app, 0n);
}

export function advanceTime(app: appWithExtras) {
    const current = process.hrtime.bigint();
    if (app.locals.status === "PLAYING") {
        if (!app.locals.lastTimestamp) {
            app.locals.lastTimestamp = process.hrtime.bigint();
            app.locals.currentTime = 0n;
            setTimeout(
                advanceTime.bind(null, app),
                app.locals.status === "PLAYING" ? 10 : 1000
            );
            return;
        }
        const diff = current - app.locals.lastTimestamp;
        app.locals.currentTime += diff;

        const currentSong =
            app.locals.md5ToSong[app.locals.queues[app.locals.queueIndex][0]];
        if (app.locals.currentTime > currentSong.duration * 1000 * 1000) {
            //let me eknow
            // this works! now to keep the party going!
            nextSong(app);
            console.log(
                "we reached the end. now playing",
                app.locals.queues[app.locals.queueIndex][0]
            );
        }
    }
    app.locals.lastTimestamp = current;
    setTimeout(
        advanceTime.bind(null, app),
        app.locals.status === "PLAYING" ? 10 : 1000
    );
}

export function sendSync(app: appWithExtras) {
    app.locals.getWss().clients.forEach((client: WebSocket) => {
        client.send("sync");
    });
}

export function previousSong(app: appWithExtras) {
    const current = app.locals.currentTime;
    if (current <= BigInt(5000000000)) {
        // 5 seconds
        app.locals.queueIndex--;
        if (app.locals.queueIndex === 0) {
            generatePreviousQueue(app);
            sendSync(app);
        }
    }
    setTimeAndSend(app, 0n);
}
