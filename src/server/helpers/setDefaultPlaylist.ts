import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PlaylistSongs, Playlists, playlists } from "../db/schema";
import { appWithExtras } from "../types/types";
import { eq } from "drizzle-orm";

// export function playlistFromQueue(queue: string[][]): PlaylistSongs {}

// export default async function setDefaultPlaylist(app: appWithExtras) {
//   const defaultQueue = app.locals.queues[app.locals.queueIndex];
//   const defaultPlaylist = app.locals.db.select().from(playlists).where(eq(playlists.name, 'Default'));
//   const playlistSongs =
// }
