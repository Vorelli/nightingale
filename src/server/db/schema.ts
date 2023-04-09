import { Pool } from "pg";
import {
  bigint,
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
} from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    year: integer("year"),
    album: text("album"),
    artist: text("artist"),
    genre: text("genre"),
  },
  (tags) => ({
    uniqueIdxId: uniqueIndex("unique_idx_id").on(tags.id),
  })
);

export const songs = pgTable(
  "songs",
  {
    md5: varchar("md5", { length: 32 }),
    path: text("path"),
    duration: bigint("duration", { mode: "bigint" }),
    tag_id: uuid("tag_id").notNull(),
  },
  (songs) => ({
    tagFk: foreignKey({ columns: [songs.tag_id], foreignColumns: [tags.id] }),
    uniqueIdxMd5: uniqueIndex("unique_idx_md5").on(songs.md5),
  })
);

export const playlists = pgTable(
  "playlists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    songMd5: varchar("songMd5", { length: 32 }),
  },
  (playlists) => ({
    songMd5Fk: foreignKey({
      columns: [playlists.songMd5],
      foreignColumns: [songs.md5],
    }),
    uniqueIdxPlaylistId: uniqueIndex("unique_idx_playlist_id").on(playlists.id),
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

export { pool, db };
