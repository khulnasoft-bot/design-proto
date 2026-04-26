import React, { useState, useRef, useEffect } from 'react';
import { useLiveAPI } from '../../lib/multimodal-live-api/LiveAPIContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  Play, 
  Square, 
  Settings,
  Activity,
  Wifi,
  WifiOff
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { logger, LogSource } from '../../lib/multimodal-live-api/logger';

export function LiveMediaControls() {
  const { connected, active, connect, disconnect, client } = useLiveAPI();
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(false);
  const [isScreenOn, setIsScreenOn] = useState(false);
  const [textInput, setTextInput] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let interval: any;
    if (active && (isCamOn || isScreenOn) && client) {
      interval = setInterval(() => {
        captureFrame();
      }, 500); // 2 fps for video streaming
    }
    return () => clearInterval(interval);
  }, [active, isCamOn, isScreenOn, client]);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current || !client) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          client.sendVideo(base64);
        };
        reader.readAsDataURL(blob);
      }
    }, 'image/jpeg', 0.6);
  };

  const toggleCamera = async () => {
    if (isCamOn) {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setIsCamOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsCamOn(true);
        setIsScreenOn(false);
        logger.log(LogSource.CLIENT, 'Media', 'Webcam started');
      } catch (err) {
        logger.log(LogSource.CLIENT, 'Error', 'Failed to start webcam', err);
      }
    }
  };

  const toggleScreen = async () => {
    if (isScreenOn) {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setIsScreenOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsScreenOn(true);
        setIsCamOn(false);
        logger.log(LogSource.CLIENT, 'Media', 'Screen capture started');
      } catch (err) {
        logger.log(LogSource.CLIENT, 'Error', 'Failed to start screen capture', err);
      }
    }
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim() && client) {
      client.sendText(textInput);
      logger.log(LogSource.CLIENT, 'Text', textInput);
      setTextInput('');
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-2 h-2 rounded-full",
            connected ? "bg-emerald-500 animate-pulse" : "bg-zinc-700"
          )} />
          <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Multimodal Live Session</h3>
        </div>
        
        <div className="flex items-center gap-2">
            {connected ? (
                <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-mono font-bold">
                    <Wifi className="w-3 h-3" /> ONLINE
                </span>
            ) : (
                <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono font-bold">
                    <WifiOff className="w-3 h-3" /> OFFLINE
                </span>
            )}
        </div>
      </div>

      {/* Video Preview */}
      <div className={cn(
        "relative aspect-video bg-black rounded-xl overflow-hidden border border-zinc-800 transition-all duration-500",
        (isCamOn || isScreenOn) ? "opacity-100 scale-100" : "opacity-0 scale-95 h-0"
      )}>
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] font-mono text-white flex items-center gap-1.5 border border-white/10">
          <Activity className="w-3 h-3 text-red-500" /> LIVE PREVIEW
        </div>
      </div>

      {connected && (
        <form onSubmit={handleSendText} className="relative">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type to the AI..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-mono"
          />
          <button 
            type="submit"
            disabled={!textInput.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-blue-400 disabled:opacity-0 transition-all"
          >
            <Activity className="w-4 h-4" />
          </button>
        </form>
      )}

      <div className="flex items-center gap-2">
        {!connected ? (
          <button
            onClick={() => connect({ systemInstruction: "You are a helpful AI research assistant. You can see and hear the user. Help them with their research and project management task." })}
            className="flex-1 flex items-center justify-center gap-2 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-current" /> START SESSION
          </button>
        ) : (
          <button
            onClick={disconnect}
            className="flex-1 flex items-center justify-center gap-2 h-12 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-all active:scale-[0.98]"
          >
            <Square className="w-4 h-4 fill-current" /> STOP SESSION
          </button>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setIsMicOn(!isMicOn)}
            className={cn(
              "w-12 h-12 flex items-center justify-center rounded-xl transition-all",
              isMicOn ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
            )}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          
          <button
            onClick={toggleCamera}
            className={cn(
              "w-12 h-12 flex items-center justify-center rounded-xl transition-all",
              isCamOn ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-zinc-800 text-zinc-400"
            )}
          >
            <Video className="w-5 h-5" />
          </button>

          <button
            onClick={toggleScreen}
            className={cn(
              "w-12 h-12 flex items-center justify-center rounded-xl transition-all",
              isScreenOn ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-zinc-800 text-zinc-400"
            )}
          >
            <Monitor className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-4 py-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center gap-3">
        <Activity className={cn("w-4 h-4", connected ? "text-emerald-500 animate-pulse" : "text-zinc-600")} />
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Audio Throughput</span>
            <span className="text-[10px] font-mono text-zinc-400 tracking-tighter">{connected ? '16.0 kHz / 16-bit' : 'Disconnected'}</span>
          </div>
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-blue-500"
              initial={{ width: 0 }}
              animate={{ width: connected ? '40%' : 0 }}
              transition={{ repeat: Infinity, duration: 2, repeatType: 'reverse' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
