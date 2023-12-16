import path from "path";
import { Database } from "bun:sqlite";
import { type InferModel, sql } from "drizzle-orm";
import { type BunSQLiteDatabase, drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import {
  type UpdateDeleteAction,
  blob,
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex
} from "drizzle-orm/sqlite-core";

const defaultCascade = {
  onDelete: "cascade" as UpdateDeleteAction,
  onUpdate: "cascade" as UpdateDeleteAction
};

export const messages = sqliteTable(
  "messages",
  {
    id: integer("id").primaryKey().notNull(),
    name: text("name").notNull(),
    body: text("body").notNull(),
    contact: text("contact").notNull(),
    dateCreated: integer("dateCreated", { mode: "timestamp" })
      .notNull()
      .default(sql`current_timestamp`)
  },
  (messages) => {
    return {
      idxMessageCreated: index("idx_message_created").on(messages.dateCreated)
    };
  }
);

export const artists = sqliteTable(
  "artists",
  {
    id: integer("id").primaryKey().notNull(),
    name: text("name").notNull()
  },
  (artists) => ({
    uniqueIdxArtistName: uniqueIndex("unique_idx_artistName").on(artists.name),
    indexedArtistName: index("idx_artistName").on(artists.name)
  })
);

export const genres = sqliteTable(
  "genres",
  {
    id: integer("id").primaryKey().notNull(),
    name: text("name").notNull()
  },
  (genres) => ({
    uniqueIdxArtistName: uniqueIndex("unique_idx_genreName").on(genres.name),
    indexedArtistName: index("idx_genreName").on(genres.name)
  })
);

export const albums = sqliteTable(
  "albums",
  {
    id: integer("id").primaryKey(),
    name: text("name"),
    year: integer("year"),
    albumArtistId: integer("albumArtist").references(() => artists.id, {
      onUpdate: "cascade",
      onDelete: "set null"
    })
  },
  (albums) => ({
    uniqueIdxId: uniqueIndex("unique_idx_id").on(albums.id)
  })
);

export const albumArtists = sqliteTable("albumArtists", {
  albumId: integer("albumId")
    .notNull()
    .references(() => albums.id, defaultCascade),
  artistId: integer("artistId")
    .notNull()
    .references(() => artists.id, defaultCascade)
});

export const albumGenres = sqliteTable("albumGenres", {
  albumId: integer("albumId")
    .notNull()
    .references(() => albums.id, defaultCascade),
  genreId: integer("genreId")
    .notNull()
    .references(() => genres.id, defaultCascade)
});

export const songs = sqliteTable(
  "songs",
  {
    md5: text("md5").notNull().primaryKey(),
    name: text("name"),
    path: text("path"),
    duration: real("duration").notNull(),
    track: integer("track"),
    lyrics: text("lyrics"),
    albumId: integer("albumId")
      .notNull()
      .references(() => albums.id, defaultCascade)
  },
  (songs) => ({
    idxAlbumId: index("idx_album_id").on(songs.albumId),
    uniqueIdxMd5: uniqueIndex("unique_idx_md5").on(songs.md5),
    uniqueIdxPath: uniqueIndex("unique_idx_path").on(songs.path),
    idxMd5: index("idx_md5").on(songs.md5)
  })
);

export const playlists = sqliteTable(
  "playlists",
  {
    id: integer("id").primaryKey(),
    name: text("name").notNull()
  },
  (playlists) => ({
    uniqueIdxPlaylistId: uniqueIndex("unique_idx_playlist_id").on(playlists.id),
    uniqueIdxPlaylistName: uniqueIndex("unique_idx_playlist_name").on(
      playlists.name
    ),
    idxPlaylistName: index("idx_playlist_name").on(playlists.name)
  })
);

export const playlistSongs = sqliteTable("playlistSongs", {
  playlistId: integer("playlistId")
    .notNull()
    .references(() => playlists.id, defaultCascade),
  order: integer("order"),
  songMd5: text("songMd5").references(() => songs.md5, defaultCascade)
});

export const session = sqliteTable(
  "session",
  {
    sid: text("sid").primaryKey().notNull(),
    sess: blob("sess", { mode: "json" }).notNull(),
    expire: integer("expire", { mode: "timestamp" }).notNull()
  },
  (session) => ({
    idx_expire: index("idx_expire").on(session.expire)
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

export function dbMigrate(__dirname: string): BunSQLiteDatabase {
  const musicDir = path.resolve(__dirname, "../music");
  console.log("migrating from:", musicDir);

  const migrateP = path.resolve(__dirname, "../music/migrations-folder");
  const sqliteDb = new Database(path.resolve(__dirname, "../music/music.db"));
  const db = drizzle(sqliteDb);
  migrate(db, { migrationsFolder: migrateP });
  return db;
}
