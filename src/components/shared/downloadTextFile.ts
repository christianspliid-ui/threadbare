/**
 * downloadTextFile — hand the browser a string as a file (THR-1134).
 *
 * The Blob + `<a download>` + `revokeObjectURL` idiom existed twice inline in
 * `EncounterCacheView` before this; both sites now call here, so the idiom lives
 * once and the incident snapshot did not add a third copy.
 *
 * Throws on failure rather than swallowing — a locked-down browser that refuses
 * the download is something the caller must tell the player about, not something
 * to fail silently into.
 */
export function downloadTextFile(
  contents: string,
  filename: string,
  mimeType = 'application/json',
): void {
  const url = URL.createObjectURL(new Blob([contents], { type: mimeType }));
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  } finally {
    // Revoked even when the click throws, so a failed download cannot leak the
    // object URL for the life of the document.
    URL.revokeObjectURL(url);
  }
}
