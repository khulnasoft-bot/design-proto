import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { MultimodalLiveClient, LiveConfig } from './multimodal-live-client';
import { AudioRecorder } from './audio-recorder';
import { AudioStreamPlayer } from './audio-stream-player';
import { logger, LogSource } from './logger';
import { LiveServerMessage } from '@google/genai';

interface LiveAPIContextType {
  connected: boolean;
  active: boolean;
  connect: (config?: LiveConfig) => Promise<void>;
  disconnect: () => void;
  client: MultimodalLiveClient | null;
  volume: number;
}

const LiveAPIContext = createContext<LiveAPIContextType | undefined>(undefined);

export function LiveAPIProvider({ children, apiKey }: { children: React.ReactNode, apiKey: string }) {
  const [connected, setConnected] = useState(false);
  const [active, setActive] = useState(false);
  const clientRef = useRef<MultimodalLiveClient | null>(null);
  const audioRecorderRef = useRef<AudioRecorder>(new AudioRecorder());
  const audioPlayerRef = useRef<AudioStreamPlayer>(new AudioStreamPlayer());

  const connect = async (config?: LiveConfig) => {
    if (!apiKey) {
      logger.log(LogSource.CLIENT, 'Error', 'API Key is missing');
      return;
    }

    const client = new MultimodalLiveClient(apiKey, config);
    clientRef.current = client;

    client.on('open', () => {
      setConnected(true);
      logger.log(LogSource.CLIENT, 'Connection', 'Live API session opened');
      audioRecorderRef.current.start();
    });

    client.on('close', () => {
      setConnected(false);
      setActive(false);
      audioRecorderRef.current.stop();
      logger.log(LogSource.CLIENT, 'Connection', 'Live API session closed');
    });

    client.on('error', (error) => {
      logger.log(LogSource.CLIENT, 'Error', 'Live API error', error);
    });

    client.on('message', (message: LiveServerMessage) => {
      logger.log(LogSource.SERVER, 'Message', 'Model message received', message);
      
      const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
      if (audioData) {
        audioPlayerRef.current.play(audioData);
      }

      if (message.serverContent?.interrupted) {
        audioPlayerRef.current.clear();
        logger.log(LogSource.CLIENT, 'Audio', 'Playback interrupted');
      }

      // Handle transcriptions
      if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
        logger.log(LogSource.SERVER, 'Transcription', message.serverContent.modelTurn.parts[0].text);
      }
      
      const inputTranscription = (message as any).serverContent?.inputAudioTranscription?.text;
      if (inputTranscription) {
        logger.log(LogSource.CLIENT, 'Transcription', inputTranscription);
      }
      
      if (message.serverContent?.turnComplete) {
        logger.log(LogSource.SERVER, 'Status', 'Turn complete');
      }
    });

    audioRecorderRef.current.on('data', (base64) => {
      client.sendAudio(base64);
    });

    await client.connect();
    setActive(true);
  };

  const disconnect = () => {
    clientRef.current?.disconnect();
    audioRecorderRef.current.stop();
    setConnected(false);
    setActive(false);
  };

  return (
    <LiveAPIContext.Provider value={{ 
      connected, 
      active, 
      connect, 
      disconnect, 
      client: clientRef.current,
      volume: 0 // Could implement volume metering later
    }}>
      {children}
    </LiveAPIContext.Provider>
  );
}

export function useLiveAPI() {
  const context = useContext(LiveAPIContext);
  if (context === undefined) {
    throw new Error('useLiveAPI must be used within a LiveAPIProvider');
  }
  return context;
}
