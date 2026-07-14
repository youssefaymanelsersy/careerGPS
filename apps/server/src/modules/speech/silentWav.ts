/**
 * Generates a 16-bit mono PCM silent WAV file purely in memory,
 * used as a fallback response when real TTS generation fails.
 */
export function generateSilentWav(
  durationSeconds = 1.0,
  sampleRate = 24000,
): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  const numSamples = Math.floor(sampleRate * durationSeconds);
  const subchunk2Size = numSamples * blockAlign;
  const chunkSize = 36 + subchunk2Size;

  const header = Buffer.alloc(44);
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(chunkSize, 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36, "ascii");
  header.writeUInt32LE(subchunk2Size, 40);

  const data = Buffer.alloc(subchunk2Size, 0);
  return Buffer.concat([header, data]);
}
