import { base64ToUint8Array } from "./utils";

export class AudioStreamPlayer {
  private audioContext: AudioContext;
  private nextStartTime: number = 0;
  private sampleRate: number;

  constructor(sampleRate = 24000) {
    this.audioContext = new AudioContext({ sampleRate });
    this.sampleRate = sampleRate;
  }

  async play(base64Data: string) {
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    const uint8Array = base64ToUint8Array(base64Data);
    const float32Array = new Float32Array(uint8Array.length / 2);
    const dataView = new DataView(uint8Array.buffer);

    for (let i = 0; i < float32Array.length; i++) {
        float32Array[i] = dataView.getInt16(i * 2, true) / 0x7FFF;
    }

    const audioBuffer = this.audioContext.createBuffer(1, float32Array.length, this.sampleRate);
    audioBuffer.getChannelData(0).set(float32Array);

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);

    const currentTime = this.audioContext.currentTime;
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime;
    }

    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
  }

  stop() {
    this.nextStartTime = 0;
    // We could potentially keep the context open or close it
  }

  async clear() {
      // Logic to clear pending audio if model is interrupted
      this.nextStartTime = 0;
  }
}
