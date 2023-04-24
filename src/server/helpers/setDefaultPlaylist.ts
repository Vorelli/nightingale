import { PlaylistSongs, Playlists, playlistSongs, playlists } from "../db/schema.js";
import { appWithExtras } from "../types/types";
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
  await app.locals.db.delete(playlists).where(eq(playlists.name, "Default"));
  const defaultPlaylist = await app.locals.db
    .insert(playlists)
    .values([{ name: "Default" }])
    .returning();
  const pSongs = playlistFromQueue(defaultQueue, defaultPlaylist[0].id);
  await app.locals.db.insert(playlistSongs).values(pSongs);
}
