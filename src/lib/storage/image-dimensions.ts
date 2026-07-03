/**
 * Minimal, dependency-free intrinsic-size sniffing for uploaded images.
 * Knowing width/height at upload time lets every render use next/image with
 * explicit dimensions — no layout shift, no native image libraries in the
 * serverless bundle.
 */
export interface ImageDimensions {
  width: number;
  height: number;
}

export function detectImageDimensions(
  buffer: Buffer,
  contentType: string,
): ImageDimensions | null {
  try {
    switch (contentType) {
      case "image/png":
        return png(buffer);
      case "image/jpeg":
        return jpeg(buffer);
      case "image/gif":
        return gif(buffer);
      case "image/webp":
        return webp(buffer);
      default:
        return null;
    }
  } catch {
    return null;
  }
}

function png(buf: Buffer): ImageDimensions | null {
  // Signature (8 bytes) + IHDR length/type (8) → width/height at 16/20.
  if (buf.length < 24 || buf.readUInt32BE(12) !== 0x49484452) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function jpeg(buf: Buffer): ImageDimensions | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buf[offset + 1];
    // SOF0–SOF15 (excluding DHT/JPG/DAC) carry dimensions.
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc
    ) {
      return {
        height: buf.readUInt16BE(offset + 5),
        width: buf.readUInt16BE(offset + 7),
      };
    }
    const length = buf.readUInt16BE(offset + 2);
    if (length < 2) return null;
    offset += 2 + length;
  }
  return null;
}

function gif(buf: Buffer): ImageDimensions | null {
  if (buf.length < 10 || buf.toString("ascii", 0, 3) !== "GIF") return null;
  return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
}

function webp(buf: Buffer): ImageDimensions | null {
  if (
    buf.length < 30 ||
    buf.toString("ascii", 0, 4) !== "RIFF" ||
    buf.toString("ascii", 8, 12) !== "WEBP"
  ) {
    return null;
  }
  const format = buf.toString("ascii", 12, 16);
  if (format === "VP8X") {
    return {
      width: 1 + buf.readUIntLE(24, 3),
      height: 1 + buf.readUIntLE(27, 3),
    };
  }
  if (format === "VP8 ") {
    return {
      width: buf.readUInt16LE(26) & 0x3fff,
      height: buf.readUInt16LE(28) & 0x3fff,
    };
  }
  if (format === "VP8L") {
    const bits = buf.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }
  return null;
}
