export const importMusicMetadata = async () => {
  const { parseFile } = await import("music-metadata");
  // Use parseFile function here
  return parseFile;
};
