export interface Song {
  md5: string;
  name: string | null;
  path: string | null;
  duration: number | null;
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
