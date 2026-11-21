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

/**
 * Verify that the uploaded bytes actually match the declared image MIME type.
 * Stops disguised HTML/SVG or corrupted files from being stored as images.
 */
export function matchesImageSignature(
  buf: Buffer,
  contentType: string,
): boolean {
  switch (contentType) {
    case "image/jpeg":
      return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    case "image/png":
      return (
        buf.length >= 8 &&
        buf[0] === 0x89 &&
        buf[1] === 0x50 &&
        buf[2] === 0x4e &&
        buf[3] === 0x47 &&
        buf[4] === 0x0d &&
        buf[5] === 0x0a &&
        buf[6] === 0x1a &&
        buf[7] === 0x0a
      );
    case "image/gif": {
      if (buf.length < 6) return false;
      const header = buf.toString("ascii", 0, 6);
      return header === "GIF87a" || header === "GIF89a";
    }
    case "image/webp":
      return (
        buf.length >= 12 &&
        buf.toString("ascii", 0, 4) === "RIFF" &&
        buf.toString("ascii", 8, 12) === "WEBP"
      );
    case "image/avif": {
      // ISO BMFF ftyp box: size (4 bytes) + "ftyp" + major brand ("avif" | "avis" | "mif1").
      if (buf.length < 12 || buf.toString("ascii", 4, 8) !== "ftyp") return false;
      const brand = buf.toString("ascii", 8, 12);
      if (brand === "avif" || brand === "avis") return true;
      // Compatible brands follow at offset 16 inside the ftyp box.
      const boxSize = Math.min(buf.readUInt32BE(0), buf.length);
      for (let i = 16; i + 4 <= boxSize; i += 4) {
        const compat = buf.toString("ascii", i, i + 4);
        if (compat === "avif" || compat === "avis") return true;
      }
      return false;
    }
    default:
      return false;
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
