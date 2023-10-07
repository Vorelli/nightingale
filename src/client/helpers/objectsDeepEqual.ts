function metadataToObj(a: MediaMetadata) {
  return {
    title: a.title,
    artist: a.artist,
    artwork: a.artwork.slice(),
    album: a.album
  };
}

export function objectsDeepEqual(a: any, b: any) {
  if (typeof a !== typeof b) return false;

  if (a.artist !== undefined && a.title !== undefined && a.artwork !== undefined && a.album !== undefined) {
    a = metadataToObj(a);
    b = metadataToObj(b);
  }

  const isArr = a.constructor && a.constructor === Array;
  const keySource = !isArr ? Object.keys(a) : a;
  for (let i = 0; i < keySource.length; i++) {
    let key = keySource[i];
    let compA = isArr ? a[i] : a[key];
    let compB = isArr ? b[i] : b[key];
    if ((compA && compA.constructor === Array) || typeof compA === "object") {
      //console.log(compA.constructor === Array ? "COMPA is an array" : "COMPA is an object", JSON.stringify(compA), JSON.stringify(compB))
      if (!objectsDeepEqual(compA, compB)) return false;
    } else {
      if (compA !== compB) return false;
    }
  }
  return true;
}
