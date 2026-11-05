// The published mirrors keep both the compressed transport and the original STL.
export async function loadMesh(loader, url) {
  if (typeof DecompressionStream !== "function") return loader.loadAsync(url);

  try {
    const response = await fetch(url + ".gz");
    if (!response.ok) throw new Error("Compressed mesh unavailable");
    let buffer = await response.arrayBuffer();
    const prefix = new Uint8Array(buffer, 0, Math.min(2, buffer.byteLength));
    if (prefix[0] === 0x1f && prefix[1] === 0x8b) {
      const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream("gzip"));
      buffer = await new Response(stream).arrayBuffer();
    }
    // A CDN may have already decoded gzip through HTTP Content-Encoding.
    if (buffer.byteLength < 84 || buffer.byteLength !== 84 + 50 * new DataView(buffer).getUint32(80, true)) {
      throw new Error("Incomplete binary STL");
    }
    return loader.parse(buffer);
  } catch {
    return loader.loadAsync(url);
  }
}
