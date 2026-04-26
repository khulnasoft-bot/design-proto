import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { EventEmitter } from "events";

export interface LiveConfig {
  model?: string;
  systemInstruction?: string;
  voiceName?: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
}

export class MultimodalLiveClient extends EventEmitter {
  private ai: GoogleGenAI;
  private session: any | null = null;
  private config: LiveConfig;

  constructor(apiKey: string, config: LiveConfig = {}) {
    super();
    this.ai = new GoogleGenAI({ apiKey });
    this.config = config;
  }

  async connect() {
    if (this.session) return;

    try {
      this.session = await this.ai.live.connect({
        model: this.config.model || "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: this.config.systemInstruction,
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: this.config.voiceName || 'Zephyr' }
            }
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
             this.emit('open');
          },
          onmessage: (message: LiveServerMessage) => {
            this.emit('message', message);
          },
          onclose: () => {
            this.session = null;
            this.emit('close');
          },
          onerror: (error: any) => {
            this.emit('error', error);
          }
        }
      });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  disconnect() {
    if (this.session) {
      this.session.close();
      this.session = null;
    }
  }

  sendAudio(base64Data: string) {
    if (!this.session) return;
    this.session.sendRealtimeInput({
      audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
    });
  }

  sendVideo(base64Data: string, mimeType: string = 'image/jpeg') {
    if (!this.session) return;
    this.session.sendRealtimeInput({
      video: { data: base64Data, mimeType }
    });
  }

  sendText(text: string) {
    if (!this.session) return;
    this.session.sendRealtimeInput({ text });
  }
}
