import { NodePgClient } from "drizzle-orm/node-postgres";
import express from "express";
import { WithWebsocketMethod } from "express-ws";

export interface Song {
  md5: string;
  name: string | null;
  path: string | null;
  duration: number;
  track: number | null;
  diskCharacter: string | null;
  lyrics: string | null;
}

export interface Album {
  name: string;
  yearReleased: number;
  albumArtist: string;
  artists: string[];
  genres: string[];
  songs: Song[];
  inDb: boolean;
}

export interface appWithExtras extends express.Application, WithWebsocketMethod {
  locals: {
    md5s: string[];
    db: NodePgClient;
    __dirname: string;
    queues: string[][];
    queueIndex: number;
    currentTime: bigint;
    lastTimestamp: bigint;
    shuffleBy: string;
    md5ToSong: { [key: string]: Song };
    status: "PLAYING" | "PAUSED";
    getWss: Function;
  };
}
