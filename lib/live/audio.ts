const DEFAULT_OUTPUT_RATE = 24000;

export function base64ToUint8(base64: string) {
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

export function uint8ToBase64(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function downsampleBuffer(
  buffer: Float32Array,
  sourceRate: number,
  targetRate: number,
) {
  if (targetRate >= sourceRate) {
    return buffer;
  }

  const ratio = sourceRate / targetRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;

    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i += 1) {
      accum += buffer[i];
      count += 1;
    }

    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult += 1;
    offsetBuffer = nextOffsetBuffer;
  }

  return result;
}

export function floatTo16BitPCM(input: Float32Array) {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, input[i]));
    output[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  return output;
}

export function extractMimeSampleRate(mimeType?: string) {
  if (!mimeType) return DEFAULT_OUTPUT_RATE;
  const match = mimeType.match(/rate=(\d+)/i);
  return match ? Number(match[1]) : DEFAULT_OUTPUT_RATE;
}

export function computeRms(input: Float32Array) {
  let sum = 0;
  for (let i = 0; i < input.length; i += 1) {
    sum += input[i] * input[i];
  }
  return Math.sqrt(sum / input.length);
}

export function computePeakAbs(input: Float32Array) {
  let peak = 0;
  for (let i = 0; i < input.length; i += 1) {
    const absolute = Math.abs(input[i]);
    if (absolute > peak) {
      peak = absolute;
    }
  }
  return peak;
}

export function computeZeroCrossingRate(input: Float32Array) {
  if (input.length < 2) {
    return 0;
  }

  let crossings = 0;
  for (let i = 1; i < input.length; i += 1) {
    const previous = input[i - 1];
    const current = input[i];
    if ((previous >= 0 && current < 0) || (previous < 0 && current >= 0)) {
      crossings += 1;
    }
  }
  return crossings / (input.length - 1);
}

export function setTracksEnabled(tracks: MediaStreamTrack[], enabled: boolean) {
  for (const track of tracks) {
    track.enabled = enabled;
  }
}
