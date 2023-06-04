import {
  doublePrecision,
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  UpdateDeleteAction,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { NodePgDatabase, drizzle } from "drizzle-orm/node-postgres";
import { InferModel } from "drizzle-orm";
import pg from "pg";
const { Pool } = pg;
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "path";
const defaultCascade = {
  onDelete: "cascade" as UpdateDeleteAction,
  onUpdate: "cascade" as UpdateDeleteAction,
};

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    name: text("name").notNull(),
    body: text("body").notNull(),
    contact: text("contact").notNull(),
    dateCreated: timestamp("dateCreated").defaultNow().notNull(),
  },
  (messages) => {
    return {
      idxMessageCreated: index("idx_message_created").on(messages.dateCreated),
    };
  }
);

export const artists = pgTable(
  "artists",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    name: text("name").notNull(),
  },
  (artists) => ({
    uniqueIdxArtistName: uniqueIndex("unique_idx_artistName").on(artists.name),
    indexedArtistName: index("idx_artistName").on(artists.name),
  })
);

export const genres = pgTable(
  "genres",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    name: text("name").notNull(),
  },
  (genres) => ({
    uniqueIdxArtistName: uniqueIndex("unique_idx_genreName").on(genres.name),
    indexedArtistName: index("idx_genreName").on(genres.name),
  })
);

export const albums = pgTable(
  "albums",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name"),
    year: integer("year"),
    albumArtist: uuid("albumArtist").references(() => artists.id, {
      onUpdate: "cascade",
      onDelete: "set null",
    }),
  },
  (albums) => ({
    uniqueIdxId: uniqueIndex("unique_idx_id").on(albums.id),
  })
);

export const albumArtists = pgTable("albumArtists", {
  albumId: uuid("albumId")
    .notNull()
    .references(() => albums.id, defaultCascade),
  artistId: uuid("artistId")
    .notNull()
    .references(() => artists.id, defaultCascade),
});

export const albumGenres = pgTable("albumGenres", {
  albumId: uuid("albumId")
    .notNull()
    .references(() => albums.id, defaultCascade),
  genreId: uuid("genreId")
    .notNull()
    .references(() => genres.id, defaultCascade),
});

export const songs = pgTable(
  "songs",
  {
    md5: varchar("md5", { length: 32 }).notNull().primaryKey(),
    name: text("name"),
    path: text("path"),
    duration: doublePrecision("duration").notNull(),
    track: integer("track"),
    lyrics: text("lyrics"),
    albumId: uuid("albumId")
      .notNull()
      .references(() => albums.id, defaultCascade),
  },
  (songs) => ({
    idxAlbumId: index("idx_album_id").on(songs.albumId),
    uniqueIdxMd5: uniqueIndex("unique_idx_md5").on(songs.md5),
    uniqueIdxPath: uniqueIndex("unique_idx_path").on(songs.path),
    idxMd5: index("idx_md5").on(songs.md5),
  })
);

export const playlists = pgTable(
  "playlists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
  },
  (playlists) => ({
    uniqueIdxPlaylistId: uniqueIndex("unique_idx_playlist_id").on(playlists.id),
    uniqueIdxPlaylistName: uniqueIndex("unique_idx_playlist_name").on(
      playlists.name
    ),
    idxPlaylistName: index("idx_playlist_name").on(playlists.name),
  })
);

export const playlistSongs = pgTable("playlistSongs", {
  playlistId: uuid("playlistId")
    .notNull()
    .references(() => playlists.id, defaultCascade),
  order: integer("order"),
  songMd5: varchar("songMd5", { length: 32 }).references(
    () => songs.md5,
    defaultCascade
  ),
});

export const session = pgTable(
  "session",
  {
    sid: varchar("sid").primaryKey().notNull(),
    sess: json("sess").notNull(),
    expire: timestamp("expire", { precision: 6 }).notNull(),
  },
  (session) => ({
    idx_expire: index("idx_expire").on(session.expire),
  })
);

export type Artists = InferModel<typeof artists>;
export type Albums = InferModel<typeof albums>;
export type AlbumGenres = InferModel<typeof albumGenres>;
export type AlbumArtists = InferModel<typeof albumArtists>;
export type Songs = InferModel<typeof songs>;
export type Genres = InferModel<typeof genres>;
export type Playlists = InferModel<typeof playlists>;
export type PlaylistSongs = InferModel<typeof playlistSongs>;
export type NewArtists = InferModel<typeof artists, "insert">;
export type NewAlbums = InferModel<typeof albums, "insert">;
export type NewAlbumGenres = InferModel<typeof albumGenres, "insert">;
export type NewAlbumArtists = InferModel<typeof albumArtists, "insert">;
export type NewSongs = InferModel<typeof songs, "insert">;
export type NewGenres = InferModel<typeof genres, "insert">;
export type NewPlaylists = InferModel<typeof playlists, "insert">;
export type NewPlaylistSongs = InferModel<typeof playlistSongs, "insert">;
export type ReturningArtists = InferModel<typeof artists, "select">;
export type ReturningAlbums = InferModel<typeof albums, "select">;
export type ReturningAlbumGenres = InferModel<typeof albumGenres, "select">;
export type ReturningAlbumArtists = InferModel<typeof albumArtists, "select">;
export type ReturningSongs = InferModel<typeof songs, "select">;
export type ReturningGenres = InferModel<typeof genres, "select">;
export type ReturningPlaylists = InferModel<typeof playlists, "select">;
export type ReturningPlaylistSongs = InferModel<typeof playlistSongs, "select">;

async function dbMigrate(d: string): Promise<[NodePgDatabase, pg.Pool]> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    idleTimeoutMillis: 50 * 1000,
    max: 50,
  });
  pool.on("error", (err, _client) => {
    console.log("server encountered error with pg database:", err);
    console.log("hopefully it will keep running...");
  });
  const newPath = path.resolve(d, "migrations-folder");
  const db = drizzle(pool);
  await migrate(db, {
    migrationsFolder: newPath,
  });
  return [db, pool];
}

export { dbMigrate };
