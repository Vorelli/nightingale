import { drizzle } from "drizzle-orm/node-postgres/driver.js";
import { PlaylistSongs, Playlists, playlistSongs, playlists } from "../db/schema.js";
import { appWithExtras } from "../types/types";
import { eq } from "drizzle-orm";
import pg from "pg";
const { Pool } = pg;

export function playlistFromQueue(queue: string[], playlistId: string): PlaylistSongs[] {
  const songs = new Array<PlaylistSongs>();
  for (var i = 0; i < queue.length; i++) {
    songs.push({
      order: i,
      songMd5: queue[i],
      playlistId: playlistId,
    } as PlaylistSongs);
  }
  return songs;
}

export default async function setDefaultPlaylist(app: appWithExtras) {
  const defaultQueue = app.locals.queues[app.locals.queueIndex];

  let pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  return new Promise<void>((resolve, reject) => {
    pool.connect(async (err, client, release) => {
      if (err) return reject(err);
      let db = drizzle(client);
      const currentDefaultPlaylist = await db
        .select()
        .from(playlists)
        .where(eq(playlists.name, "Default"));
      // If it exists, delete its songs from playlistSongs
      if (currentDefaultPlaylist && currentDefaultPlaylist[0]) {
        await db
          .delete(playlistSongs)
          .where(eq(playlistSongs.playlistId, currentDefaultPlaylist[0].id));
      }
      await db.delete(playlists).where(eq(playlists.name, "Default"));
      const defaultPlaylist = await db
        .insert(playlists)
        .values([{ name: "Default" }])
        .returning();
      const pSongs = playlistFromQueue(defaultQueue, defaultPlaylist[0].id);
      await db.insert(playlistSongs).values(pSongs);
      resolve();
      release();
    });
  });
}
