import { type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { type Application, type RouterLike, type WithWebsocketMethod } from 'express-ws'
import { type Dirent } from 'fs'
import { type Pool } from 'pg'
import { type WebSocket } from 'ws'
import type ws from 'ws'

export interface FilePathAndMD5 {
  md5: string
  filePath: string
}

export interface DirectoryAndSubElements {
  name: string
  files: Dirent[]
}

export interface Song {
  md5: string
  name: string | null
  path: string | null
  duration: number
  track: number | null
  lyrics: string | null
}

export interface Album {
  name: string
  yearReleased: number
  albumArtist: string
  artists: string[]
  genres: string[]
  songs: Song[]
  inDb: boolean
  albumId?: string
}

export interface WsInstance {
  app: Application & WithWebsocketMethod
  applyTo: (target: RouterLike) => void
  getWss: () => ws.Server
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace Express {
    interface Locals {
      md5s: string[]
      __dirname: string
      queues: string[][]
      queueIndex: number
      currentTime: bigint
      lastTimestamp: bigint | undefined
      shuffleBy: string
      md5ToSong: Record<string, Song>
      infoDir: string
      status: 'PLAYING' | 'PAUSED'
      getWss: () => { clients: Set<WebSocket> }
      pool: Pool
      db: NodePgDatabase
    }
    interface Application extends WithWebsocketMethod { }
  }
}
