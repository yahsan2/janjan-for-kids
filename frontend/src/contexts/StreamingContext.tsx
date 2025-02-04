import React, { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import { useExpression } from './ExpressionContext';

interface StreamingContextType {
  isStreaming: boolean;
  setIsStreaming: (value: boolean) => void;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  getVideoElement: () => HTMLVideoElement | null;
  error: string | null;
  setError: (value: string | null) => void;
  registerDisplayVideo: (element: HTMLVideoElement) => void;
  unregisterDisplayVideo: (element: HTMLVideoElement) => void;
}

const StreamingContext = createContext<StreamingContextType | undefined>(undefined);

export function StreamingProvider({ children }: { children: ReactNode }) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const displayVideosRef = useRef<Set<HTMLVideoElement>>(new Set());
  const hasStartedDetectionRef = useRef(false);
  const { startDetection, stopDetection, isModelLoaded } = useExpression();

  // 初期化時に video 要素を作成
  React.useEffect(() => {
    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    // video要素をDOMに追加しないようにする
    videoRef.current = video;

    return () => {
      if (videoRef.current) {
        stopCamera();
        videoRef.current = null;
      }
    };
  }, []);

  // ストリーミング状態の監視
  useEffect(() => {
    if (isStreaming && isModelLoaded && videoRef.current && !hasStartedDetectionRef.current) {
      console.log('ストリーミング開始、表情認識を開始します');
      hasStartedDetectionRef.current = true;
      startDetection(videoRef.current);
    } else if (!isStreaming && hasStartedDetectionRef.current) {
      console.log('ストリーミング停止、表情認識を停止します');
      stopDetection();
      hasStartedDetectionRef.current = false;
    }
  }, [isStreaming, isModelLoaded, startDetection, stopDetection]);

  const startCamera = useCallback(async () => {
    if (!videoRef.current) {
      setError('Video element is not initialized');
      return;
    }

    if (!isModelLoaded) {
      setError('顔認識モデルの読み込みが完了するまでお待ちください');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      // メインのビデオ要素にストリームを設定
      videoRef.current.srcObject = stream;

      // 表示用のビデオ要素にもストリームを設定
      for (const displayVideo of displayVideosRef.current) {
        displayVideo.srcObject = stream;
      }

      videoRef.current.onloadedmetadata = () => {
        console.log('ビデオメタデータ読み込み完了');
        setIsStreaming(true);
        setError(null);
      };
    } catch (error) {
      console.error('カメラの起動に失敗しました:', error);
      setError('カメラの起動に失敗しました。カメラへのアクセスを許可してください。');
    }
  }, [isModelLoaded]);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      for (const track of stream.getTracks()) {
        track.stop();
      }
      videoRef.current.srcObject = null;

      // 表示用のビデオ要素のストリームもクリア
      for (const displayVideo of displayVideosRef.current) {
        displayVideo.srcObject = null;
      }

      setIsStreaming(false);
    }
  }, []);

  const registerDisplayVideo = useCallback((element: HTMLVideoElement) => {
    displayVideosRef.current.add(element);
    // すでにストリームが存在する場合は、新しく登録された要素にも設定
    if (videoRef.current?.srcObject) {
      element.srcObject = videoRef.current.srcObject;
    }
  }, []);

  const unregisterDisplayVideo = useCallback((element: HTMLVideoElement) => {
    if (element.srcObject) {
      element.srcObject = null;
    }
    displayVideosRef.current.delete(element);
  }, []);

  const getVideoElement = useCallback(() => {
    return videoRef.current;
  }, []);

  return (
    <StreamingContext.Provider value={{
      isStreaming,
      setIsStreaming,
      startCamera,
      stopCamera,
      getVideoElement,
      error,
      setError,
      registerDisplayVideo,
      unregisterDisplayVideo
    }}>
      {children}
    </StreamingContext.Provider>
  );
}

export function useStreaming() {
  const context = useContext(StreamingContext);
  if (context === undefined) {
    throw new Error('useStreaming must be used within a StreamingProvider');
  }
  return context;
}
