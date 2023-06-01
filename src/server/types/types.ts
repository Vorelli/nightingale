import { NodePgClient, NodePgDatabase } from "drizzle-orm/node-postgres";
import express from "express";
import { WithWebsocketMethod } from "express-ws";
import { Pool } from "pg";

export interface Song {
  md5: string;
  name?: string;
  path?: string;
  duration: number;
  track?: number;
  lyrics?: string;
}

export interface Album {
  name: string;
  yearReleased: number;
  albumArtist: string;
  artists: string[];
  genres: string[];
  songs: Song[];
  inDb: boolean;
  albumId?: string;
}

export interface appWithExtras
  extends express.Application,
    WithWebsocketMethod {
  locals: {
    md5s: string[];
    __dirname: string;
    queues: string[][];
    queueIndex: number;
    currentTime: bigint;
    lastTimestamp: bigint;
    shuffleBy: string;
    md5ToSong: { [key: string]: Song };
    infoDir: string;
    status: "PLAYING" | "PAUSED";
    getWss: Function;
    pool: Pool;
    db: NodePgDatabase;
  };
}
