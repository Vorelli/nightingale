//  import sqlite3 from 'sqlite3'
// const smDb = new sqlite3.Database("../persist.db", sqlite3.OPEN_READWRITE);

import { type Application, type WithWebsocketMethod } from "express-ws";
import { type WebSocket } from "ws";

/**
 * This function initializes the list of queues by setting the list of queues to the current list of MD5s (shuffled)
 * and then generates a next and previous queue based off of this queue. Also sets the status to PLAYING
 *
 * @param {Application & WithWebsocketMethod} app - The express application with goodies on the app.
 */
export function initializeQueue(app: Application & WithWebsocketMethod): void {
  // smDb.all();
  setQueue(app, shuffle(app.locals.md5s));
  app.locals.status = "PLAYING";
  generateNextQueue(app);
  generatePreviousQueue(app);
}

/**
 * This function sets the queues array to an array with the queue passed in as its only element. Also sets queueIndex to 0.
 *
 * @param {Application & WithWebsocketMethod} app - The express application with goodies on the app.locals object
 * @param {string[]} queue - The list of MD5s to be set as the first queue.
 */
export function setQueue(
  app: Application & WithWebsocketMethod,
  queue: string[]
): void {
  app.locals.queues = [queue];
  app.locals.queueIndex = 0;
}

/**
 * This function returns a random index to an array within the last 1/4 for a bit of variability in element order
 *
 * @param {any[]} queue - A queue of elements
 * @returns {number} A random index within the last 1/4 of the queue
 */
export function randomIndexFromQueue(queue: any[]): number {
  const add = Math.floor(queue.length * 0.75);
  return Math.floor(add + Math.random() * Math.ceil(queue.length * 0.25));
}

/**
 * Generates the next queue based on the current queue indicated via app.locals.queueIndex
 *
 * @param {Application & WithWebsocketMethod} app - The express application with goodies in the app.locals object
 * @throws {Error} - This error is thrown when current queue is empty
 */
export function generateNextQueue(
  app: Application & WithWebsocketMethod
): void {
  if (app.locals.md5s.length > 0) {
    const newQueue = app.locals.queues[app.locals.queueIndex].slice();
    switch (app.locals.shuffleBy) {
      default: {
        const first = newQueue.shift();
        if (first === undefined) {
          throw new Error(
            "trying to generate new previous queue and first is undefined!"
          );
        }
        newQueue.splice(randomIndexFromQueue(newQueue) + 1, 0, first);
      }
    }
    app.locals.queues.push(newQueue);
  }
}

/**
 * Generates the previous queue and adds it to the list of queues on the app.locals object.
 *
 * TODO: This will change as there are more methods to shuffly by.
 *
 * @param {Application & WithWebsocketMethod} app - The express application with goodies on the app.locals.object
 * @throws {Error} - This error is thrown when the queue is empty
 */
export function generatePreviousQueue(
  app: Application & WithWebsocketMethod
): void {
  if (app.locals.md5s.length > 0) {
    const newQueue = app.locals.queues[app.locals.queueIndex].slice();
    switch (app.locals.shuffleBy) {
      default: {
        const random = newQueue.splice(randomIndexFromQueue(newQueue), 1);
        if (random?.[0] === undefined) {
          throw new Error(
            "trying to generate new previous queue and random is undefined!"
          );
        }
        newQueue.splice(0, 0, random[0]);
      }
    }
    app.locals.queueIndex =
      (app.locals.queueIndex + 1) % (app.locals.queues.length + 1);
    app.locals.queues.unshift(newQueue);
  }
}

/**
 * This function shuffles any array
 *
 * @param {T1[]} arr - Any array to be shuffled
 * @returns {T1[]} Returns a shuffled array of the same type that was passed in
 */
export function shuffle<T1>(arr: T1[]): T1[] {
  return arr.sort(() => 0.5 - Math.random());
}

/**
 * This function sets the time to whatever is passed in and then sends it to all WS clients.
 *
 * @param {Application & WithWebsocketMethod} app - The express application with goodies on the app.locals object
 * @param {bigint} time - The new time in Microseconds (I believe)
 */
export function setTimeAndSend(
  app: Application & WithWebsocketMethod,
  time: bigint
): void {
  app.locals.currentTime = time;
  sendSync(app);
}

/**
 * This function progresses the current state of the queues. If the queueIndex ends up pointing to the last element, the next queue will be generated
 * Also resets the time to 0.
 *
 * @param {Application & WithWebsocketMethod} app - The express application with goodies on the app.locals object
 */
export function nextSong(app: Application & WithWebsocketMethod): void {
  app.locals.queueIndex++;
  if (app.locals.queueIndex === app.locals.queues.length - 1) {
    generateNextQueue(app);
  }
  setTimeAndSend(app, BigInt(0));
}

/**
 * This function is called over and over every 10 or 1000 ms depending on if it's playing (more accurate) or paused (no need).
 * It 'advances time' within our app.locals object. That's how the server keeps track of the position of the current song (in time).
 * If our local approximation of time goes over the length of the song, the next song will be played and sent to all WS clients.
 *
 * TODO: This function will fall out of sync with the clients playing the songs when switching from paused to play.
 * This is because of waiting between 10 and 1000 ms. Will need to keep track of timers in the app.locals object.
 * When switching between playing and paused, these timers can be updated and the currentTime kept in line with clients.
 *
 * @param {Application & WithWebsocketMethod} app - The express application with extra goodies on the app.locals object.
 */
export function advanceTime(app: Application & WithWebsocketMethod): void {
  const current = process.hrtime.bigint();
  if (app.locals.status === "PLAYING") {
    if (app.locals.lastTimestamp === undefined) {
      app.locals.lastTimestamp = process.hrtime.bigint();
      app.locals.currentTime = BigInt(0);
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
      // let me eknow
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

/**
 * This function sends a sync command to all WS clients. This tells the clients to grab the current status from the server and
 * use those values from now on.
 *
 * @param {Application & WithWebsocketMethod} app - The express application with goodies on the app.locals object
 */
export function sendSync(app: Application & WithWebsocketMethod): void {
  app.locals.getWss().clients.forEach((client: WebSocket) => {
    client.send("sync");
  });
}

/**
 * This function is called when a client presses the previous song button.
 * If within the first 5s of a song, it will go to the last song.
 * Anywhere else in the song past that and it will go to the start of the current song (setting currentTime to 0).
 *
 * @param {Application & WithWebsocketMethod} app - The express application with goodies on the app.locals object
 */
export function previousSong(app: Application & WithWebsocketMethod): void {
  const current = app.locals.currentTime;
  if (current <= BigInt(5000000000)) {
    // 5 seconds
    app.locals.queueIndex--;
    if (app.locals.queueIndex === 0) {
      generatePreviousQueue(app);
      sendSync(app);
    }
  }
  setTimeAndSend(app, BigInt(0));
}
