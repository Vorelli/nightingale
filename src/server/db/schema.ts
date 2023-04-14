import {
  bigint,
  doublePrecision,
  foreignKey,
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core/index.js";
import { drizzle } from "drizzle-orm/node-postgres/index.js";
import { InferModel, sql } from "drizzle-orm/index.js";
import pg from "pg";
import { eq, or } from "drizzle-orm/expressions";
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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
    albumArtist: uuid("albumArtist"),
  },
  (tags) => ({
    uniqueIdxId: uniqueIndex("unique_idx_id").on(tags.id),
  })
);

export const albumArtists = pgTable(
  "albumArtists",
  {
    albumId: uuid("albumId").notNull(),
    artistId: uuid("artistId").notNull(),
  },
  (albumArtists) => ({
    albumIdFk: foreignKey({ columns: [albumArtists.albumId], foreignColumns: [albums.id] }),
    artistIdFk: foreignKey({ columns: [albumArtists.artistId], foreignColumns: [artists.id] }),
  })
);

export const albumGenres = pgTable(
  "albumGenres",
  {
    albumId: uuid("albumId").notNull(),
    genreId: uuid("genreId").notNull(),
  },
  (albumGenres) => ({
    album2IdFk: foreignKey({ columns: [albumGenres.albumId], foreignColumns: [albums.id] }),
    genreIdFk: foreignKey({ columns: [albumGenres.genreId], foreignColumns: [genres.id] }),
  })
);

export const songs = pgTable(
  "songs",
  {
    md5: varchar("md5", { length: 32 }).notNull().primaryKey(),
    name: text("name"),
    path: text("path"),
    duration: doublePrecision("duration"),
    track: integer("track"),
    diskCharacter: integer("diskCharacter"),
    lyrics: text("lyrics"),
    albumId: uuid("albumId").notNull(),
  },
  (songs) => ({
    albumIdFk: foreignKey({ columns: [songs.albumId], foreignColumns: [albums.id] }),
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
    uniqueIdxPlaylistName: uniqueIndex("unique_idx_playlist_name").on(playlists.name),
    idxPlaylistName: index("idx_playlist_name").on(playlists.name),
  })
);

export const playlistSongs = pgTable(
  "playlistSongs",
  {
    playlistId: uuid("playlistId").notNull(),
    songMd5: varchar("songMd5", { length: 32 }),
  },
  (playlistSongs) => ({
    songMd5Fk: foreignKey({
      columns: [playlistSongs.songMd5],
      foreignColumns: [songs.md5],
    }),
    playlistIdFk: foreignKey({
      columns: [playlistSongs.playlistId],
      foreignColumns: [playlists.id],
    }),
  })
);

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

const db = drizzle(pool);

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

export { pool, db };
