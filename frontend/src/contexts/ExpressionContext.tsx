import * as faceapi from 'face-api.js';
import React, { createContext, useContext, useState, useRef, useEffect, useMemo, type ReactNode } from 'react';

export type ExpressionKey = 'neutral' | 'happy' | 'sad' | 'angry' | 'fearful' | 'disgusted' | 'surprised' | 'noface' | 'error';

interface ExpressionContextType {
  expressionKey: ExpressionKey | null;
  setExpressionKey: (value: ExpressionKey | null) => void;
  expressionText: string | null;
  isModelLoaded: boolean;
  setIsModelLoaded: (value: boolean) => void;
  error: string | null;
  setError: (value: string | null) => void;
  startDetection: (videoElement: HTMLVideoElement) => void;
  stopDetection: () => void;
}

const expressionMap: Record<ExpressionKey, string> = {
  neutral: '無表情',
  happy: '幸せ',
  sad: '悲しい',
  angry: '怒り',
  fearful: '恐れ',
  disgusted: '嫌悪',
  surprised: '驚き',
  noface: '顔を検出できません',
  error: '認識エラー'
};

const ExpressionContext = createContext<ExpressionContextType | undefined>(undefined);

export function ExpressionProvider({ children }: { children: ReactNode }) {
  const [expressionKey, setExpressionKey] = useState<ExpressionKey | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<number>();
  const isDetectingRef = useRef(false);

  // 日本語の表情テキストをメモ化
  const expressionText = useMemo(() => {
    return expressionKey ? expressionMap[expressionKey] : null;
  }, [expressionKey]);

  // 表情認識の処理
  const detectExpression = async (video: HTMLVideoElement) => {
    if (!isModelLoaded || !isDetectingRef.current) {
      console.log('モデル未ロードまたは検出停止中')
      return
    }

    try {
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.5
        }))
        .withFaceExpressions()

      if (detection) {
        console.log('顔を検出:', detection)
        // 最も確率の高い表情を取得
        const expressions = detection.expressions
        let maxExpression: ExpressionKey = 'neutral'
        let maxProbability = 0

        for (const [expr, probability] of Object.entries(expressions)) {
          if (probability > maxProbability) {
            maxProbability = probability
            maxExpression = expr as ExpressionKey
          }
        }

        setExpressionKey(maxExpression)
      } else {
        setExpressionKey('noface')
      }
    } catch (error) {
      console.error('表情認識に失敗しました:', error)
      setExpressionKey('error')
    }

    // 1秒後に次の検出をスケジュール
    if (isDetectingRef.current) {
      timeoutRef.current = window.setTimeout(() => {
        detectExpression(video)
      }, 1000)
    }
  }

  // モデルの読み込み
  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log('モデルの読み込みを開始します...')
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/assets/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/assets/models')
        ])
        console.log('モデルの読み込みが完了しました')
        setIsModelLoaded(true)
      } catch (error) {
        console.error('モデルの読み込みに失敗しました:', error)
        setError('顔認識モデルの読み込みに失敗しました')
      }
    }
    loadModels()
  }, [])

  const startDetection = (videoElement: HTMLVideoElement) => {
    if (!isModelLoaded) {
      setError('顔認識モデルの読み込みが完了するまでお待ちください')
      return
    }
    isDetectingRef.current = true
    detectExpression(videoElement)
  }

  const stopDetection = () => {
    isDetectingRef.current = false
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setExpressionKey(null)
  }

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <ExpressionContext.Provider value={{
      expressionKey,
      setExpressionKey,
      expressionText,
      isModelLoaded,
      setIsModelLoaded,
      error,
      setError,
      startDetection,
      stopDetection
    }}>
      {children}
    </ExpressionContext.Provider>
  );
}

export function useExpression() {
  const context = useContext(ExpressionContext);
  if (context === undefined) {
    throw new Error('useExpression must be used within an ExpressionProvider');
  }
  return context;
}
