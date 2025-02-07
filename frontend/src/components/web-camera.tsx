import { useEffect, useRef } from "react";
import { useExpression } from "../contexts/ExpressionContext";
import { useStreaming } from "../contexts/StreamingContext";

export function WebCamera({ className }: { className: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const {
    isStreaming,
    startCamera,
    stopCamera,
    error,
    registerDisplayVideo,
    unregisterDisplayVideo,
  } = useStreaming();
  const { isModelLoaded } = useExpression();

  // 表示用のビデオ要素を登録
  useEffect(() => {
    if (videoRef.current) {
      registerDisplayVideo(videoRef.current);
      return () => {
        if (videoRef.current) {
          unregisterDisplayVideo(videoRef.current);
        }
      };
    }
  }, [registerDisplayVideo, unregisterDisplayVideo]);

  return (
    <div className={className}>
      <div className="mb-4 space-x-4">
        <button
          type="button"
          onClick={isStreaming ? stopCamera : startCamera}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          disabled={!isModelLoaded}
        >
          {isStreaming ? "カメラを停止" : "カメラを有効にする"}
        </button>
      </div>
      {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}
      <div>
        <h3 className="text-lg font-semibold mb-2">表情認識</h3>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full rounded-lg shadow-lg"
          aria-label="カメラのプレビュー"
        >
          <track kind="captions" />
        </video>
      </div>
    </div>
  );
}
