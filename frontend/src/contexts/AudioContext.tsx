import { type ReactNode, createContext, useCallback, useContext, useRef, useState } from "react";
import { AudioRecorder } from "../utils/audio-recorder";

interface AudioContextType {
  isRecording: boolean;
  setIsRecording: (value: boolean) => void;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  volume: number;
  setVolume: (value: number) => void;
  error: string | null;
  setError: (value: string | null) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioRecorder] = useState(() => new AudioRecorder());
  const lastVolumeUpdateTime = useRef(0);
  const lastVolumeValue = useRef(0);

  const throttledSetVolume = useCallback((newVolume: number) => {
    const now = Date.now();
    const volumeDiff = Math.abs(newVolume - lastVolumeValue.current);

    // 一定のボリュームがあるか、音量が10%以上変化した場合のみ更新
    if (newVolume > 0.01 || volumeDiff > 0.25) {
      setVolume(newVolume);
      lastVolumeValue.current = newVolume;
    }
    lastVolumeUpdateTime.current = now;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      audioRecorder.on("volume", (newVolume: number) => {
        throttledSetVolume(newVolume);
      });

      await audioRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (error) {
      console.error("音声録音の開始に失敗しました:", error);
      setError("マイクの起動に失敗しました。マイクへのアクセスを許可してください。");
      setIsRecording(false); // エラー時にisRecordingをfalseに設定
    }
  }, [audioRecorder, throttledSetVolume]);

  const stopRecording = useCallback(() => {
    try {
      audioRecorder.stop();
      // イベントリスナーを削除
      audioRecorder.removeAllListeners("volume");
      setIsRecording(false);
      setVolume(0);
    } catch (error) {
      console.error("音声録音の停止に失敗しました:", error);
      setError("音声録音の停止に失敗しました。");
    }
  }, [audioRecorder]);

  return (
    <AudioContext.Provider
      value={{
        isRecording,
        setIsRecording,
        startRecording,
        stopRecording,
        volume,
        setVolume,
        error,
        setError,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
