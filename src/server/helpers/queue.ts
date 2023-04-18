import { appWithExtras } from "../server";

function initializeQueue(app: appWithExtras) {
  app.locals.queues = [shuffle(app.locals.md5s)];
  app.locals.status = "PLAYING";
  app.locals.queueIndex = 0;
  generateNextQueue(app);
  generatePreviousQueue(app);
}

function randomIndexFromQueue(queue: any[]): number {
  return queue.length > 10
    ? Math.floor(Math.random() * (queue.length - 10)) + 10
    : Math.floor(Math.random() * queue.length);
}

function generateNextQueue(app: appWithExtras) {
  if (app.locals.md5s.length > 0) {
    const newQueue = app.locals.queues[app.locals.queueIndex].slice();
    switch (app.locals.shuffleBy) {
      default:
        const first = newQueue.shift();
        if (first === undefined)
          throw new Error("trying to generate new previous queue and first is undefined!");
        newQueue.splice(randomIndexFromQueue(newQueue), 0, first as string);
    }
    app.locals.queues.push(newQueue);
  }
}

function generatePreviousQueue(app: appWithExtras) {
  if (app.locals.md5s.length > 0) {
    const newQueue = app.locals.queues[app.locals.queueIndex].slice();
    switch (app.locals.shuffleBy) {
      default:
        const random = newQueue.splice(randomIndexFromQueue(newQueue), 1)[0];
        if (random === undefined)
          throw new Error("trying to generate new previous queue and random is undefined!");
        newQueue.splice(0, 0, random as string);
    }
    app.locals.queueIndex = (app.locals.queueIndex + 1) % app.locals.queues.length;
    app.locals.queues.unshift(newQueue);
  }
}

function shuffle(arr: any[]) {
  return arr.sort(() => 0.5 - Math.random());
}

function nextSong(app: appWithExtras) {
  app.locals.queueIndex++;
  if (app.locals.queueIndex === app.locals.queues.length - 1) {
    generateNextQueue(app);
  }
  app.locals.currentTime = 0n;
  app.locals.getWss().clients.forEach((client: WebSocket) => {
    client.send("nextSong");
  });
}

function advanceTime(app: appWithExtras) {
  const current = process.hrtime.bigint();
  if (app.locals.status === "PLAYING") {
    if (!app.locals.lastTimestamp) {
      app.locals.lastTimestamp = process.hrtime.bigint();
      app.locals.currentTime = 0n;
      setTimeout(advanceTime.bind(null, app), app.locals.status === "PLAYING" ? 10 : 1000);
      return;
    }
    const diff = current - app.locals.lastTimestamp;
    app.locals.currentTime += diff;

    const currentSong = app.locals.md5ToSong[app.locals.queues[app.locals.queueIndex][0]];
    if (app.locals.currentTime > currentSong.duration * 1000 * 1000) {
      //let me eknow
      // this works! now to keep the party going!
      nextSong(app);
      console.log("we reached the end. now playing", app.locals.queues[app.locals.queueIndex][0]);
    }
  }
  app.locals.lastTimestamp = current;
  setTimeout(advanceTime.bind(null, app), app.locals.status === "PLAYING" ? 10 : 1000);
}

export { initializeQueue, advanceTime };
