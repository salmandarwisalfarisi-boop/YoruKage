/**
 * Deobfuscator — Poin 1: Ekstraksi Data & Deobfuscation Lanjutan
 *
 * Menangani berbagai jenis obfuscation JavaScript yang ditemukan di host streaming
 * seperti Kwik.cx / Kwik.si:
 *   1. Standard Packer (p,a,c,k,e,d) — Dean Edwards' packer
 *   2. String Array Rotation (SARot) — teknik array + shifter
 *   3. Hex / Unicode escape sequence
 *   4. Control Flow Flattening (CFF) — switch/while loop dispatcher
 *   5. Dynamic token / signature extraction dari query string atau inline script
 */

import vm from 'node:vm';
import crypto from 'node:crypto';

// -------------------------------------------------------------------
// 1. PACKER (p,a,c,k,e,d) — Dean Edwards Standard
// -------------------------------------------------------------------

/**
 * Mendeteksi apakah sebuah string mengandung pola Packer.
 */
export function isPacked(code: string): boolean {
  return /\}\s*\('[\s\S]*?',\s*\d+,\s*\d+,\s*'[\s\S]*?'\.split\(/.test(code) ||
    /eval\s*\(\s*function\s*\(\s*p\s*,\s*a\s*,\s*c\s*,\s*k\s*,\s*e\s*,\s*(?:d|r)\s*\)/.test(code);
}

/**
 * Unpack script obfuscasi Packer menggunakan sandboxed VM.
 * Aman: tidak mengekspos objek global Node.js ke sandbox.
 */
export function unpackPacker(code: string): string {
  let result = '';

  const sandbox = Object.create(null) as Record<string, unknown>;
  sandbox.eval = (unpacked: string) => {
    result = unpacked;
  };

  try {
    vm.createContext(sandbox);
    // Pastikan hanya blok eval(...) yang dieksekusi
    const match = code.match(/eval\s*\(\s*(function\s*\(p,a,c,k,e,(?:d|r)\)[\s\S]*?)\s*\)/);
    if (match) {
      vm.runInContext(`eval(${match[1]})`, sandbox, { timeout: 5000 });
    } else {
      vm.runInContext(code.replace(/^eval/, 'eval'), sandbox, { timeout: 5000 });
    }
  } catch {
    // Diabaikan — sandbox timeout atau syntax error
  }

  return result || code;
}

// -------------------------------------------------------------------
// 2. STRING ARRAY ROTATION (SARot)
// -------------------------------------------------------------------

/**
 * Mendeteksi pola String Array Rotation:
 * Biasanya berupa array string besar diikuti fungsi rotate/shift dan fungsi decoder.
 * Contoh: var _0xabc = ['str1','str2',...]; (function(_0xabc, n){ ... })(_0xabc, 0x1234);
 */
export function hasStringArrayRotation(code: string): boolean {
  return /var\s+_0x[0-9a-f]+\s*=\s*\[/.test(code) &&
    /\(function\s*\(_0x[0-9a-f]+/.test(code);
}

/**
 * Attempt partial deobfuscation String Array Rotation via sandboxed eval.
 * Metode: biarkan VM mengeksekusi definisi array + fungsi decoder, lalu replace
 * semua panggilan decoder dengan nilai string-nya menggunakan regex proxy.
 */
export function unpackStringArrayRotation(code: string): string {
  let result = code;

  try {
    // Ekstrak definisi array dan fungsi rotate sebelum penggunaan
    const arrayDef = code.match(/(var\s+_0x[0-9a-f]+\s*=\s*\[[^\]]*\]\s*;[\s\S]*?)\(function\s*\(_0x[0-9a-f]+/)?.[1];
    if (!arrayDef) return code;

    // Eksekusi definisi di sandbox untuk mendapatkan nilai array
    const sandbox = Object.create(null) as Record<string, unknown>;
    sandbox.console = { log: () => {} };

    vm.createContext(sandbox);
    vm.runInContext(arrayDef, sandbox, { timeout: 3000 });

    // Coba ganti setiap pemanggilan _0xXXXX(n) dengan nilai string literal-nya
    result = code.replace(/_0x[0-9a-f]+\s*\(\s*0x([0-9a-f]+)\s*\)/gi, (_match, hex) => {
      const fn = Object.keys(sandbox).find((k) => typeof sandbox[k] === 'function');
      if (!fn) return _match;
      try {
        const val = (sandbox[fn] as (n: number) => string)(parseInt(hex, 16));
        return JSON.stringify(val);
      } catch {
        return _match;
      }
    });
  } catch {
    // Gagal — kembalikan kode asli
  }

  return result;
}

// -------------------------------------------------------------------
// 3. HEX / UNICODE ESCAPE DECODER
// -------------------------------------------------------------------

/**
 * Mengubah escape sequence \xNN dan \uNNNN ke karakter aslinya.
 */
export function decodeEscapeSequences(code: string): string {
  return code
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// -------------------------------------------------------------------
// 4. CONTROL FLOW FLATTENING (CFF) EXTRACTOR
// -------------------------------------------------------------------

/**
 * Mendeteksi pola Control Flow Flattening (switch/while dispatcher).
 * CFF biasanya memiliki struktur: while(true){ switch(_state){ case 'X': ...; _state = 'Y'; break; } }
 */
export function hasControlFlowFlattening(code: string): boolean {
  return /while\s*\(\s*true\s*\)\s*\{[\s\S]*?switch\s*\(/.test(code) ||
    /switch\s*\([^)]*\)\s*\{[\s\S]*?case\s*['"][0-9a-f]+['"]/i.test(code);
}

// -------------------------------------------------------------------
// 5. DYNAMIC TOKEN / SIGNATURE EXTRACTOR
// -------------------------------------------------------------------

export interface StreamTokenInfo {
  /** URL stream langsung (.m3u8 / .mp4) */
  streamUrl: string | null;
  /** Token parameter (misal: ?token=xxx&expires=yyy) */
  token: string | null;
  /** Timestamp kedaluwarsa (unix) */
  expiresAt: number | null;
  /** Apakah link sudah kedaluwarsa */
  expired: boolean;
}

/**
 * Mengekstrak URL stream beserta metadata token / expiry dari kode JavaScript yang sudah di-unpack.
 */
export function extractStreamToken(unpackedCode: string): StreamTokenInfo {
  const result: StreamTokenInfo = {
    streamUrl: null,
    token: null,
    expiresAt: null,
    expired: false
  };

  // -- Cari URL stream (.m3u8 / .mp4 / .ts)
  const patterns = [
    /source\s*=\s*["']([^"']+\.m3u8[^"']*)/,
    /source\s*=\s*["']([^"']+\.mp4[^"']*)/,
    /src\s*[:=]\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)/,
    /"file"\s*:\s*"([^"]+\.(?:m3u8|mp4)[^"]*)"/,
    /\burl\s*[:=]\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)/,
  ];

  for (const pattern of patterns) {
    const m = unpackedCode.match(pattern);
    if (m?.[1]) {
      result.streamUrl = m[1];
      break;
    }
  }

  // -- Cari token dari URL atau dari variabel inline
  if (result.streamUrl) {
    try {
      const parsed = new URL(result.streamUrl, 'https://example.com');
      result.token = parsed.searchParams.get('token') ||
        parsed.searchParams.get('sig') ||
        parsed.searchParams.get('s');

      const exp = parsed.searchParams.get('expires') || parsed.searchParams.get('e');
      if (exp) {
        result.expiresAt = parseInt(exp, 10) * 1000;
        result.expired = Date.now() > result.expiresAt;
      }
    } catch {
      // URL tidak valid — abaikan
    }
  }

  // -- Cari token variabel inline jika tidak ada di URL
  if (!result.token) {
    const tokenMatch = unpackedCode.match(/['"](token|sig|s)['"]\s*:\s*['"]([^'"]+)['"]/i);
    if (tokenMatch) result.token = tokenMatch[2];
  }

  return result;
}

// -------------------------------------------------------------------
// 6. DEOBFUSCATE PIPELINE (semua langkah dirangkai)
// -------------------------------------------------------------------

export interface DeobfuscationResult {
  code: string;
  techniques: string[];
  streamInfo: StreamTokenInfo;
  fingerprint: string;
}

/**
 * Pipeline deobfuscation lengkap.
 * Menjalankan semua teknik secara berurutan dan mengembalikan hasil akhir.
 */
export function deobfuscate(rawCode: string): DeobfuscationResult {
  const techniques: string[] = [];
  let code = rawCode;

  // Langkah 1: Decode escape sequences
  const decoded = decodeEscapeSequences(code);
  if (decoded !== code) {
    techniques.push('hex/unicode-escape-decode');
    code = decoded;
  }

  // Langkah 2: String Array Rotation
  if (hasStringArrayRotation(code)) {
    const unpacked = unpackStringArrayRotation(code);
    if (unpacked !== code) {
      techniques.push('string-array-rotation');
      code = unpacked;
    }
  }

  // Langkah 3: Packer (p,a,c,k,e,d)
  if (isPacked(code)) {
    const unpacked = unpackPacker(code);
    if (unpacked && unpacked !== code) {
      techniques.push('packer(p,a,c,k,e,d)');
      code = unpacked;
      // Packer bisa berlapis — unpack lagi jika masih terpacked
      if (isPacked(code)) {
        const twice = unpackPacker(code);
        if (twice && twice !== code) {
          techniques.push('packer-double-layer');
          code = twice;
        }
      }
    }
  }

  // Langkah 4: CFF detection (logging saja, tidak dimodifikasi)
  if (hasControlFlowFlattening(code)) {
    techniques.push('control-flow-flattening-detected');
  }

  // Langkah 5: Ekstrak URL stream & token
  const streamInfo = extractStreamToken(code);

  // Fingerprint untuk logging / cache key
  const fingerprint = crypto.createHash('sha256').update(rawCode.slice(0, 500)).digest('hex').slice(0, 16);

  return { code, techniques, streamInfo, fingerprint };
}
