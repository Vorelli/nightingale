import { type Dirent } from "fs";
import { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import {
  type Application as App,
  type RouterLike,
  type WithWebsocketMethod
} from "express-ws";
import { type WebSocket } from "ws";
import type ws from "ws";

export interface FilePathAndMD5 {
  md5: string;
  filePath: string;
}

export interface DirectoryAndSubElements {
  name: string;
  files: Dirent[];
}

export type ClientFriendlyPlaylistData = Record<
  number,
  {
    name: string;
    songs: string[];
  }
>;

export interface ClientFriendlySongData {
  md5: string;
  path: string;
  duration: number;
  track: number;
  lyrics: string;
  name: string;
  albumName: string;
  year: number;
  albumArtist: string;
  genres: string[];
  artists: string[];
  albumId: string;
  albumArtistId: string;
}

export interface Song {
  md5: string;
  name: string | null;
  path: string | null;
  duration: number;
  track: number | null;
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
  albumId?: number;
}

export interface WsInstance {
  app: App & WithWebsocketMethod;
  applyTo: (target: RouterLike) => void;
  getWss: () => ws.WebSocketServer;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace Express {
    interface Locals {
      md5s: string[];
      __dirname: string;
      queues: string[][];
      queueIndex: number;
      currentTime: bigint;
      lastTimestamp: bigint | undefined;
      shuffleBy: string;
      md5ToSong: Record<string, Song>;
      infoDir: string;
      status: "PLAYING" | "PAUSED";
      getWss: () => { clients: Set<WebSocket> };
      db: BunSQLiteDatabase;
      loadingSongs: Promise<Album[]>;
    }
  }
}
