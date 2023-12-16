import { eq } from "drizzle-orm";
import { type Application, type WithWebsocketMethod } from "express-ws";
import {
  type PlaylistSongs,
  playlistSongs,
  playlists
} from "../../db/schema.js";

export function playlistFromQueue(
  queue: string[],
  playlistId: number
): PlaylistSongs[] {
  return queue.map((songMd5: string, i: number) => {
    const playlistSong: PlaylistSongs = { order: i, songMd5, playlistId };
    return playlistSong;
  });
}

export default async function setDefaultPlaylist(
  app: Application & WithWebsocketMethod
): Promise<void> {
  try {
    const defaultQueue = app.locals.queues[app.locals.queueIndex];
    const { db } = app.locals;
    const currentDefaultPlaylists = db
      .select()
      .from(playlists)
      .where(eq(playlists.name, "Default"))
      .all();
    currentDefaultPlaylists.map((playlist) => {
      return db
        .delete(playlistSongs)
        .where(eq(playlistSongs.playlistId, playlist.id))
        .run();
    });
    db.delete(playlists).where(eq(playlists.name, "Default")).run();
    const defaultPlaylist = db
      .insert(playlists)
      .values([{ name: "Default" }])
      .returning()
      .all();
    const pSongs = playlistFromQueue(defaultQueue, defaultPlaylist[0].id);
    db.insert(playlistSongs).values(pSongs).run();
  } catch (err) {
    console.log("error occurred when trying to set the default playlist");
    throw err;
  }
}
