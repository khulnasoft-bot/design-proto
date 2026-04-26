import { floatTo16BitPCM, ArrayBufferToBase64 } from "./utils";
import { EventEmitter } from "events";

export class AudioRecorder extends EventEmitter {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: AudioWorkletNode | ScriptProcessorNode | null = null;
  private recording = false;
  private sampleRate = 16000;

  constructor(sampleRate = 16000) {
    super();
    this.sampleRate = sampleRate;
  }

  async start() {
    if (this.recording) return;

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioContext = new AudioContext({ sampleRate: this.sampleRate });
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    this.source = this.audioContext.createMediaStreamSource(this.stream);
    
    // Using ScriptProcessor for simplicity in this environment, though AudioWorklet is better
    this.processor = this.audioContext.createScriptProcessor(2048, 1, 1);
    
    this.processor.onaudioprocess = (e) => {
      if (!this.recording) return;
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBuffer = floatTo16BitPCM(inputData);
      const base64 = ArrayBufferToBase64(pcmBuffer);
      this.emit('data', base64);
    };

    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
    
    this.recording = true;
    this.emit('start');
  }

  stop() {
    if (!this.recording) return;
    
    this.recording = false;
    this.source?.disconnect();
    this.processor?.disconnect();
    this.stream?.getTracks().forEach(track => track.stop());
    
    if (this.audioContext?.state !== 'closed') {
      this.audioContext?.close();
    }
    
    this.emit('stop');
  }
}
