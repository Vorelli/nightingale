import fs from 'fs/promises'
import md5File from 'md5-file'
import {
  type AlbumArtists,
  albumArtists,
  albumGenres,
  type Albums,
  albums,
  type Artists,
  artists,
  type AlbumGenres,
  genres,
  songs,
  type Songs,
  type Genres,
  type ReturningArtists,
  type ReturningGenres,
  type ReturningAlbums,
  type NewArtists,
  type NewGenres,
  type ReturningAlbumGenres,
  type ReturningAlbumArtists,
  type ReturningSongs
} from '../db/schema.js'
import { eq, and } from 'drizzle-orm'
import path from 'path'
import { getAudioDurationInSeconds } from 'get-audio-duration'
import sharp from 'sharp'
import ffmpeg from 'fluent-ffmpeg/index.js'
import { type ICommonTagsResult, parseFile } from '@vorelli/music-metadata'
import { type FilePathAndMD5, type Album, type Song, type DirectoryAndSubElements } from '../types/types.js'
import { getAlbumToInsert, getSongsToInsert } from './dbHelpers.js'
import { type Application } from 'express'
import { type Dirent } from 'fs'
import { type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { type AnySQLiteTable } from 'drizzle-orm/sqlite-core/index.js'

interface innerJoinReturn {
  songs: Songs
  albums: Albums
  artists: Artists
  albumArtists: AlbumArtists
  genres: Genres
  albumGenres: AlbumGenres
}
let app: Application

export async function loadSongs (appFromSource: Application): Promise<Album[]> {
  app = appFromSource
  const musicDir = process.env.MUSIC_DIRECTORY as string
  return await processPaths([path.resolve(musicDir)])
    .then(async (md5s) => await processMd5s(app, md5s))
}

async function processPaths (pathsInMusic: Dirent[] | string[], parentDir = ''): Promise<Array<{ md5: string, filePath: string }>> {
  const filePromises: Array<Promise<FilePathAndMD5>> = []
  const tempPaths: Array<Promise<DirectoryAndSubElements>> = []

  for (let i = 0; i < pathsInMusic.length; i++) {
    const filePath = pathsInMusic[i]
    if (typeof filePath === 'string' || filePath.isDirectory()) {
      tempPaths.push(handleDir(filePath, parentDir))
    } else if (filePath.isFile() || filePath.isSymbolicLink()) {
      const actualFilePath = path.join(parentDir, filePath.name)
      filePromises.push(
        md5File(actualFilePath).then((md5) => ({
          md5,
          filePath: actualFilePath
        }))
      )
    }
  }

  return await Promise.all(tempPaths)
    .then(async (dirs) => await processDirectories(parentDir, dirs))
    .then(async (files) => await Promise.all([...filePromises, ...files]))
}

async function processDirectories (parentDir: string, directories: DirectoryAndSubElements[]): Promise<FilePathAndMD5[]> {
  const pathsProcessing: Array<Promise<FilePathAndMD5[]>> = []

  for (let i = 0; i < directories.length; i++) {
    const newPath = path.join(parentDir, directories[i].name)
    pathsProcessing.push(processPaths(directories[i].files, newPath))
  }

  return await Promise.all(pathsProcessing).then((paths) => paths.flat())
}

interface WithOptionalAlbumId {
  albumId?: string
}

function getAlbumFromRows (rows: innerJoinReturn[]): Album | undefined {
  const albumObj: Album | undefined = rows.reduce(
    (acc: Album | undefined, val: innerJoinReturn) => {
      if (acc === undefined) {
        const songs = val.songs as Songs & WithOptionalAlbumId
        const tempAlbumId = val.songs.albumId
        delete (songs as WithOptionalAlbumId).albumId
        const albumArtist = findArtistName(rows, val.albums.albumArtistId) ?? 'Unknown Artist'
        const albums: Album = {
          name: val.albums.name ?? 'Unknown Album Name',
          yearReleased: val.albums.year ?? 1970,
          albumArtist,
          artists: [val.artists.name],
          genres: [val.genres.name],
          songs: [songs],
          inDb: true,
          albumId: tempAlbumId
        }
        return albums
      } else {
        if (val.artists.name === undefined) val.artists.name = 'Unknown Artist'
        if (val.genres.name === undefined) val.genres.name = 'Unknown Genre'

        if (!acc.artists.includes(val.artists.name)) acc.artists.push(val.artists.name)
        if (!acc.genres.includes(val.genres.name)) acc.genres.push(val.genres.name)
      }
      return acc
    },
    undefined
  )
  return albumObj
}

function findArtistName (artistList: innerJoinReturn[], artistId: number | null): string | null {
  if (artistId === null) return null
  for (let i = 0; i < artistList.length; i++) {
    if (artistList[i].artists.id === artistId) {
      return artistList[i].artists.name
    }
  }
  return null
}

/**
 * This function compares the tags between two albums. If any of them are not matching (the user may have updated them or the tag-reading utility impoved), update the tags with the most current ones.
 * @param app Express application with extra goodies on its locals object.
 * @param a Album 1 you want to compare
 * @param b Album | boolean 2 you want to compare. This is intended to be the most recent album information (read from disk).
 * @returns void
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function compareTagsAndUpdate (app: Application, a: Album, b: Album | boolean, cb: () => any): Promise<void> {
  const albumKeys = ['name', 'yearReleased', 'albumArtist', 'artists', 'genres'] as Array<keyof Album>
  if (typeof b === 'boolean') return
  const keyPromises = new Array<Promise<void>>()
  for (const key of albumKeys) {
    const compA = a[key]
    const compB = b[key]
    keyPromises.push(
      new Promise((resolve, reject) => {
        if (['name', 'yearReleased', 'albumArtist'].includes(key)) {
          if (compA !== compB) {
            // return false;
            console.log('trying to set', key, b[key])
            resolve(app.locals.db.update(albums).set({ [key]: b[key] }).all())
          }
          resolve()
        } else {
          const aList = a[key] as string[]
          const bList = b[key] as string[]
          // if a has more than b, that means we'll need to delete some and possibly update some.
          const needToDelete = aList.filter(
            (str) => !bList.includes(str)
          )
          const needToAdd = bList.filter(
            (str) => !aList.includes(str)
          )
          const albumArtistI = needToDelete.reduce(
            (acc, v, i) =>
              acc === -1 && v === a.albumArtist ? i : acc,
            -1
          )
          const table = key === 'artists' ? artists : genres
          const entitiesNeededToBeDeleted = Promise.all(
            needToDelete.map((name) => {
              console.log('newName:', name, typeof name)
              return app.locals.db
                .select()
                .from(table)
                .where(eq(table.name, name))
                .all()
            })
          )
          const addsToDb: Array<Promise<any>> = []
          entitiesNeededToBeDeleted
            .then((entities) => entities.flat())
            .then(async (entities) => {
              if (key === 'artists' && albumArtistI !== -1) {
                // we are deleting the album artist. we need to replace it.
                if (needToAdd.length === 0) {
                  // we are trying to delete the album's albumArtist so lets not
                  entities.splice(albumArtistI, 1)
                }
              }
              return await Promise.all(
                entities.map(async (entity) =>
                  await Promise.resolve(entity.id)
                )
              )
            })
            .then(async (ids) =>
              await Promise.all(
                ids.map((id) =>
                  app.locals.db
                    .delete(table)
                    .where(eq(table.id, id))
                    .all()
                )
              )
            )
            .then(async () => {
              needToDelete.length > 0 &&
                console.log('deleted:', needToDelete)
              return await Promise.all(
                needToAdd.map((newName) => {
                  console.log(
                    'newName:',
                    newName,
                    typeof newName
                  )
                  return app.locals.db
                    .select()
                    .from(table)
                    .where(eq(table.name, newName))
                    .all()
                })
              )
            })
            .then(async (existingArr) => {
              const additions = Promise.all(
                needToAdd
                  .filter((_newName, i) => {
                    console.log(
                      'type of albumId:',
                      typeof a.albumId
                    )
                    if (
                      existingArr[i].length > 0 &&
                      typeof a.albumId === 'string'
                    ) {
                      if (key === 'artists') {
                        console.log(
                          'adding existing artist to album:',
                          existingArr[i][0],
                          b.name
                        )
                        addsToDb.push(app.locals.db
                          .insert(albumArtists)
                          .values({
                            artistId:
                              existingArr[i][0]
                                .id,
                            albumId: a.albumId
                          })
                          .all())
                      } else {
                        console.log(
                          'adding existing genre to album:',
                          existingArr[i][0],
                          b.name
                        )
                        addsToDb.push(app.locals.db
                          .insert(albumGenres)
                          .values({
                            genreId:
                              existingArr[i][0]
                                .id,
                            albumId: a.albumId
                          }).all())
                      }
                    }
                    console.log(
                      'length:',
                      existingArr[i].length
                    )
                    return existingArr[i].length === 0
                  })
                  .map((newName) => {
                    console.log(
                      'inserting into:',
                      key,
                      newName
                    )
                    return app.locals.db
                      .insert(table)
                      .values({ name: newName })
                      .returning()
                      .all()
                  })
              )
              return await Promise.all([additions, Promise.all(addsToDb)]).then(([additions, _adds]) => additions)
            })
            .then(async (additions) => {
              // now that we added the genres or artists, we need to:
              //    add them to the album. (aka create relation in the join table)
              //    now for artists, we need to keep track of if an artist was an albums' artistAlbum.
              //    if we deleted the artistAlbum, we need to replace it.

              const inserts = new Array<any>()
              const albumId = a.albumId
              for (let i = 0; i < additions.length; i++) {
                for (let j = 0; j < additions[i].length; j++) {
                  if (key === 'artists') {
                    const artistId = (
                      additions[i][j] as NewArtists
                    ).id
                    if (
                      typeof artistId === 'string' &&
                      typeof albumId === 'string'
                    ) {
                      console.log(
                        'inserting albumArtist:',
                        additions[i][j].name,
                        b.name
                      )
                      inserts.push(
                        app.locals.db
                          .insert(albumArtists)
                          .values({
                            artistId,
                            albumId
                          })
                          .all()
                      )
                    }
                  } else {
                    const genreId = (
                      additions[i][j] as NewGenres
                    ).id
                    if (
                      typeof genreId === 'string' &&
                      typeof albumId === 'string'
                    ) {
                      console.log(
                        'inserting albumGenre:',
                        additions[i][j].name,
                        b.name
                      )
                      inserts.push(
                        app.locals.db
                          .insert(albumGenres)
                          .values({
                            genreId,
                            albumId
                          })
                          .all()
                      )
                    }
                  }
                }
              }

              const replacement = b.albumArtist
              let replacementI = -1
              for (let i = 0; i < needToAdd.length; i++) {
                if (needToAdd[i] === replacement) { replacementI = i }
              }
              if (albumArtistI !== -1) {
                if (replacementI === -1) {
                  // we just assign the first one ? i guess?
                  replacementI = 0
                }
                // great we just need to add it and then update the join table
                Promise.all<ReturningArtists>(inserts)
                  .then((ret) => {
                    const newAlbumArtist =
                      ret[replacementI]
                    if (typeof albumId === 'string') {
                      console.log(
                        'setting newAlbumArtist to album',
                        b.name,
                        newAlbumArtist.name
                      )
                      return app.locals.db
                        .update(albums)
                        .set({
                          albumArtistId:
                            newAlbumArtist.id
                        })
                        .where(eq(albums.id, albumId))
                        .all()
                    }
                  })
                  .catch((err) => {
                    console.log(
                      'error occurred when doing stuff:',
                      err
                    )
                  }
                  )
              }
              await Promise.all(inserts).then(() => {
                needToAdd.length > 0 &&
                  console.log('inserted:', needToAdd)
              })
            })
            .then(() => { resolve() })
            .catch((err) => { reject(err) })
        }
      })
    )
  }
  const keys = Object.keys(a.songs[0])
  const songPromises = new Array<Promise<void>>()
  for (let i = 0; i < keys.length; i++) {
    if (keys[i] === 'md5') continue
    songPromises.push(
      new Promise((resolve, _reject) => {
        const key = keys[i] as keyof Song
        if (a.songs[0][key] !== b.songs[0][key]) {
          // return false;
          const set = app.locals.db
            .update(songs)
            .set({ [key]: b.songs[0][key] })
            .where(eq(songs.md5, b.songs[0].md5))
            .all()
          console.log('updated:', key, b.songs[0][key])
          resolve(set)
        } else resolve()
      })
    )
  }
  // return true;
  await Promise.all([Promise.all(keyPromises), Promise.all(songPromises)]).then(
    (ret) => {
      console.log(ret)
      cb()
    }
  )
}

async function processMd5s (app: Application, md5s: FilePathAndMD5[]): Promise<Album[]> {
  console.log('FILES WITH MD5s NOT IN DB:')

  return await Promise.all(
    md5s.map(async ({ md5, filePath }) => {
      return await new Promise<boolean | Album>((resolve, reject) => {
        try {
          const rows = app.locals.db.select().from(songs)
            .innerJoin(albums, eq(songs.albumId, albums.id))
            .innerJoin(
              albumArtists,
              and(eq(albumArtists.albumId, albums.id), eq(albums.albumArtistId, albumArtists.artistId))
            )
            .innerJoin(albumGenres, eq(albumGenres.albumId, albums.id))
            .innerJoin(genres, eq(albumGenres.genreId, genres.id))
            .innerJoin(artists, eq(albumArtists.artistId, artists.id))
            .where(eq(songs.md5, md5))
            .all()
          if (rows.length === 0) {
            resolve(getSongInfo(app, filePath, md5))

            // TODO: use a .then on the getSongInfo to insert it into the database
            // And once it's in the database, then we don't have to worry about it
            // And we can just return that 'Albums object'
          } else {
            const ret = getAlbumFromRows(rows)
            if (ret === undefined) { resolve(false); return }
            // TODO: I started on the path to comparing information on disk versus in the database.
            // that would be the next direction here. so if information on disk changes, those changes are reflected in the database.
            // What would be nice is when it detects changes on disk, but can be pretty confidant it's the same song is to
            // move/rename the streaming file instead of creating a new one and forgetting about the old one.
            // const compare = await getSongInfo(app, filePath, md5);
            resolve(ret)
            // if (ret === undefined) return resolve(false);
            // compareTagsAndUpdate(app, ret, compare, () => resolve(ret));
            // we need to delete the current album from the database.
            // this should include the song.
            // I don't think we should delete the artist or genre.
            // These can be cleaned up when the server checks for danglers in the db
          }
        } catch (err) {
          console.error('failed db search:', err)
          reject(err)
        }
      })
    })
  )
    .then(
      (ret: Array<Album | boolean>) =>
        ret.filter(
          (a: Album | boolean) => typeof a !== 'boolean'
        ) as Album[]
    )
    .then(async (songList: Album[]): Promise<Album[]> => {
      // songList is an array of Albums or booleans
      // could be in the database or could need to be added.
      // Does it matter if I just spam insert a bunch of data that already exists?
      const songsNotInDb: Album[] = songList.filter((song) => !song.inDb)
      const mergedAlbums = new Map<string, Album>()
      for (let i = 0; i < songsNotInDb.length; i++) {
        const normalizedName = songsNotInDb[i].name
          .toLocaleLowerCase()
          .trim()
          .normalize()
        const song = mergedAlbums.get(normalizedName)
        if (song?.name === undefined) {
          mergedAlbums.set(
            normalizedName,
            JSON.parse(JSON.stringify(songsNotInDb[i]))
          )
        } else {
          song.songs.push(songsNotInDb[i].songs[0])
        }
      }
      console.log('merged albums:', mergedAlbums)

      // now that albums are merged into a similar sort of grouping, we can insert into the database.
      // var inserts: Promise<void>[] = [];
      return await new Promise<Album[]>((resolve, reject) => {
        insertAllIntoDb(app.locals.db, mergedAlbums)
          .then(() => {
            /*
                name: rows[0].albums.name ?? "Unknown Album Name",
                  yearReleased: rows[0].albums.year || 1970,
                  albumArtist:
                    (rows[0].albums.albumArtist && findArtistName(rows, rows[0].albums.albumArtist)) ||
                    "Unknown Artist Name",
                    artists: rows.map((row: innerJoinReturn) => row.artists.name),
                    genres: rows.map((row: innerJoinReturn) => row.genres.name),
                  songs: [rows[0].songs],
                  inDb: true,
                */
            console.table(
              songList
                .map((album) => album.songs.map((s) => s.md5))
                .flat()
            )
            // resolve(songList.flat() as Album[]);
            resolve(songList)
          })
          .catch((err) => {
            reject(err)
          })
        // eventually this is what I want: but need to finish inserts first. resolve(songList.map((album) => album.songs[0].md5));
      })
    })
    .catch((err) => {
      console.log(
        'error occurred when trying to instert the songList into the database:',
        err
      )
      return err
    })
}

function uniqueFromObject (objs: Map<string, any>, key: string, seen: string[]): string[] {
  const uniqueFromObj: string[] = []
  Array.from(objs.values()).forEach((obj) =>
    obj[key].forEach((curr: string) => {
      if (!uniqueFromObj.includes(curr) && !seen.includes(curr)) {
        uniqueFromObj.push(curr)
      }
    })
  )
  return uniqueFromObj
}

async function insertAllIntoDb (
  db: BetterSQLite3Database,
  albumList: Map<string, Album>
): Promise<void> {
  const artistLookUps = Array.from(albumList.values()).flatMap(
    (album: Album) =>
      album.artists.map(async (artist: string) =>
        db
          .select()
          .from(artists)
          .where(eq(artists.name, artist))
          .all()
      )
  )
  const genreLookUps = Array.from(albumList.values()).flatMap((album) =>
    album.genres.map(async (genre) =>
      db.select().from(genres).where(eq(genres.name, genre)).all()
    )
  )

  await Promise.all([
    Promise.all(artistLookUps),
    Promise.all(genreLookUps)
  ]).then(
    async (returnFromDb: [ReturningArtists[][], ReturningGenres[][]]) => {
      function uniqueElements (arr: string[]): string[] {
        return [...new Set(arr)]
      }

      const uniqueCol = (
        col: string,
        existingArr: any[],
        tag: string = 'name'
      ): Array<Record<string, string>> => {
        return uniqueFromObject(albumList, col, existingArr).map(
          (val: string) => ({
            [tag]: val
          })
        )
      }

      function insertIntoTable<T1> (
        table: AnySQLiteTable,
        values: any[]
      ): T1[] {
        return values.length === 0 ? [] : db.insert(table).values(values).returning().all() as T1[]
      }

      const returnedArtistNames = uniqueElements(
        returnFromDb[0]
          .map((a) => a.length !== 0 && (a[0].name))
          .filter((a) => typeof a === 'string') as string[]
      )

      const returnedGenreNames = uniqueElements(
        returnFromDb[1]
          .map((a) => a.length !== 0 && (a[0].name))
          .filter((a) => typeof a === 'string') as string[]
      )

      const uniqueArtists = uniqueCol('artists', returnedArtistNames)
      const uniqueGenres = uniqueCol('genres', returnedGenreNames)
      console.log(
        'returned genre names and unique genre names:',
        returnedGenreNames,
        uniqueGenres
      )
      const artistInserts = insertIntoTable<ReturningArtists>(artists, uniqueArtists)
      const genreInserts = insertIntoTable<ReturningGenres>(genres, uniqueGenres)

      const nameToId = <T>(
        arr: T[],
        tagKey: keyof T,
        tagValue: keyof T
      ): Map<any, any> => {
        const map = new Map<any, any>()
        arr.forEach((a: T) => {
          if (a[tagValue] !== undefined) {
            map.set(a[tagValue], a[tagKey])
          }
        })
        return map
      }

      const artistNameToId = nameToId<ReturningArtists>(
        [...artistInserts, ...returnFromDb[0]].flat(),
        'id',
        'name'
      )
      const genreNameToId = nameToId(
        [...genreInserts, ...returnFromDb[1]].flat(),
        'id',
        'name'
      )

      const albumsToInsert = Array.from(albumList.values()).map(
        (album: Album) =>
          getAlbumToInsert(
            album,
            artistNameToId.get(album.albumArtist)
          )
      )

      const insertedAlbums: ReturningAlbums[] = insertIntoTable(
        albums,
        albumsToInsert
      )

      const albumToId = insertedAlbums.reduce<Record<string, number>>((acc, cur) => {
        if (cur.name !== null) {
          acc[cur.name] = cur.id
        }
        return acc
      }, {})

      const songsToInsert = Array.from(albumList.values()).flatMap(
        (album) => getSongsToInsert(album, albumToId[album.name])
      )

      const albumArtistsToInsert = Array.from(albumList.values()).flatMap(
        (album) =>
          album.artists.map((artist) => ({
            albumId: albumToId[album.name],
            artistId: artistNameToId.get(artist)
          }))
      )

      const albumGenresToInsert = Array.from(albumList.values()).flatMap(
        (album) =>
          album.genres.map((genre) => ({
            albumId: albumToId[album.name],
            genreId: genreNameToId.get(genre)
          }))
      )

      return [
        insertIntoTable<ReturningSongs>(songs, songsToInsert),
        insertIntoTable<ReturningAlbumArtists>(albumArtists, albumArtistsToInsert),
        insertIntoTable<ReturningAlbumGenres>(albumGenres, albumGenresToInsert)
      ]
    }
  )
}

async function handleDir (filePath: string | Dirent, parentDir = ''): Promise<DirectoryAndSubElements> {
  const name = typeof filePath === 'string' ? filePath : filePath.name
  const actualLocation = path.join(parentDir, name)
  return await fs.readdir(actualLocation, { withFileTypes: true })
    .then(files => ({ name, files }))
    .catch(err => {
      console.log('failed to read', actualLocation, err)
      throw err
    })
}

/**
 * This function resolves to an Album or a boolean depending on the outcomes.
 * @param app the express app used for its file paths on the locals object.
 * @param filePath File path of the music file. Should be an absolute path.
 * @param md5 The MD5 of the music file. Passed around for efficiency.
 * @returns Promise<Album | boolean> - A boolean is returned when it is found the file is not an audio file. An album otherwise.
            */
async function getSongInfo (app: Application, filePath: string, md5: string): Promise<Album | boolean> {
  const streamingPath = getPath(app, md5, 'mp4')
  return await fileDoesntExist(streamingPath)
    .then(async (doesntExist) => {
      if (doesntExist) {
        await new Promise<void>((resolve, reject) => {
          try {
            ffmpeg(filePath, {})
              .withNoVideo()
              .withAudioCodec('aac')
              .withAudioBitrate(192)
              .output(streamingPath)
              .on('end', () => { resolve() })
              .on('error', (err) => {
                reject(err)
              })
              .run()
          } catch (err) {
            reject(err)
          }
        })
      }
    })
    .then(async () => {
      const duration = getAudioDurationInSeconds(streamingPath).then(
        (durationInSeconds) => durationInSeconds * 1000
      )

      const tags = parseFile(filePath).then(
        (tags) => tags.common
      )

      const imageChecking = fileDoesntExist(
        getPath(app, md5, 'jpg')
      )

      return await Promise.all([tags, imageChecking, duration]).then(async ([tags, doesntExist, duration]: [ICommonTagsResult, boolean, number]) => {
        if (doesntExist && tags.picture !== undefined && tags.picture.length > 0) {
          const newImage = await sharp(tags.picture[0].data)
            .resize(256)
            .jpeg()
            .toBuffer()
          const streamingPath = getPath(app, md5, 'jpg')
          fs.writeFile(streamingPath, newImage).catch((err) => { console.log('Error occurred when trying to write new image to disk:', err) })
        }
        return craftAlbumObj(tags, md5, filePath, duration)
      })
    })
    .catch((_err) => {
      const fileP = filePath.split('/')
      console.log('not audio:', fileP[fileP.length - 1])
      return false
    })
}

async function fileDoesntExist (filePath: string): Promise<boolean> {
  return await fs.access(filePath).then(() => false).catch((err) => {
    if (err?.code === 'ENOENT') {
      return true // this is if it does not exist
    } else throw err
  })
}

function craftAlbumObj (tags: ICommonTagsResult, md5: string, filePath: string, duration: number): Album {
  const albumArtist =
    tags.albumartist ??
    tags.artist ??
    (tags.artists?.length !== undefined && tags.artists.length > 0
      ? tags.artists[0]
      : 'No artist name found. Add one using an ID3 editor!')

  return {
    name: tags.album ?? 'No Album Name Given. Add one using an ID3 editor!',
    yearReleased: tags.originalyear ?? tags.year ?? 1970,
    albumArtist,
    artists: tags.artists?.length !== undefined && tags.artists.length > 0
      ? tags.artists
      : [
          albumArtist
        ],
    genres: tags.genre === undefined || tags.genre.length < 0 ? ['Genre Missing'] : tags.genre,
    songs: [
      {
        md5,
        path: path.relative(
          path.resolve(process.env.MUSIC_DIRECTORY as string),
          path.resolve(filePath)
        ),
        duration: isNaN(duration) ? 10000 : duration,
        track: tags.track.no ?? 0,
        lyrics:
          tags.lyrics !== undefined && tags.lyrics?.length > 0
            ? formatLyrics(tags.lyrics).join('\n')
            : 'No lyrics available for this song. Consider adding them with an ID3 tag editor!',
        name: tags.title ?? 'No title available for this song.MD5:' + md5
      }
    ],
    inDb: false
  }
}

function formatLyrics (lyrics: string[]): string[] {
  return lyrics.length === 1 ? lyrics[0].split('/\r?\n/g') : lyrics
}

function getPath (app: Application, fileName: string, ext: string): string {
  return path.resolve(app.locals.__dirname, 'public/streaming/', fileName + '.' + ext)
}
