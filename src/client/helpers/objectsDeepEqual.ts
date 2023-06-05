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

    if (a.artist && a.title && a.artwork && a.album) {
        a = metadataToObj(a);
        b = metadataToObj(b);
    }

    const isArr = a instanceof Array;
    for (var key of !isArr ? Object.keys(a) : a) {
        let compA = a[key];
        let compB = b[key];
        if (compA instanceof Array || typeof compA === "object") {
            if (!objectsDeepEqual(compA, compB)) return false;
        } else {
            if (compA !== compB) return false;
        }
    }
    return true;
}
