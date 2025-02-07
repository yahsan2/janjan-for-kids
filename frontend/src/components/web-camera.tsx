import c from "classnames";
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
    <div className={c("space-y-4", className)}>
      <div className="flex gap-4 items-center">
        <button
          type="button"
          onClick={isStreaming ? stopCamera : startCamera}
          className="rounded-xl px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined filled">videocam</span>
          {isStreaming ? "カメラを停止する" : "カメラを有効にする"}
        </button>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={c("w-1/3 rounded-lg shadow-lg", {
            hidden: !isStreaming,
          })}
          aria-label="カメラのプレビュー"
        >
          <track kind="captions" />
        </video>
      </div>
      {error ? (
        <div className="py-2 px-4 bg-red-100 text-red-700 rounded text-sm">{error}</div>
      ) : (
        <div className="py-2 px-4 bg-blue-100 text-blue-700 rounded text-xs">
          映像データはブラウザ上での顔認識でのみ利用し、本サービスのサーバー含む外部には送信しません。
        </div>
      )}
    </div>
  );
}
