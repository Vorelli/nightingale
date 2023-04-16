export const isAudio = (buffer: Buffer): boolean => {
  const hexOfBuffer = buf2hex(buffer);

  const bufferStarts: { [key: string]: string } = {
    ["FLAC"]: "664c614300000022",
    ["WMA"]: "3026B2758E66CF11A6D900AA0062CE6C",
    ["AIFF"]: "464F524D00",
    ["MP3"]: "494433",
    ["AVI"]: "52494646xxxxxxxx415649204C495354",
    ["WAV"]: "52494646xxxxxxxx57415645666D7420",
    ["M4A"]: "667479704D344120",
    ["MP4"]: "FFF1",
    ["MP2"]: "FFF9",
    ["MP3 1"]: "FFFB",
    ["MP3 2"]: "FFF3",
    ["MP3 3"]: "FFF2",
    ["MP3 4"]: "494433",
  };

  for (var format in bufferStarts) {
    const formatString = bufferStarts[format].toLowerCase();
    if (format === "AVI" || format === "WAV") {
      if (formatString.slice(16) === hexOfBuffer.slice(16, 16 + formatString.length)) {
        return true;
      }
    } else if (formatString === hexOfBuffer.slice(0, formatString.length)) {
      return true;
    }
  }
  return false;
};

function buf2hex(buffer: Buffer) {
  // buffer is an ArrayBuffer

  return Array.prototype.map
    .call(new Uint8Array(buffer), (x) => ("00" + x.toString(16)).slice(-2))
    .join("");
}
