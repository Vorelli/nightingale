import { PlaylistSongs, playlistSongs, playlists } from "../db/schema.js";
import { appWithExtras } from "../types/types.js";
import { eq } from "drizzle-orm";

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
  const { db } = app.locals;
  return new Promise<void>(async (resolve, reject) => {
    try {
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
    } catch (err) {
      console.log("error occurred when trying to set the default playlist");
      reject(err);
    }
  });
}
