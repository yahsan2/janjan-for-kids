import c from "classnames";
import type { ReactNode } from "react";
import { useAudio } from "../contexts/AudioContext";
import AudioPulse from "./audio-pulse/AudioPulse";
import { WebCamera } from "./web-camera";

export function WelcomeOverlay({ children }: { children: ReactNode }) {
  const { isRecording, startRecording, stopRecording, volume } = useAudio();
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">ジャンジャンAIにようこそ！</h2>
          <p className="text-gray-600">
            ジャンジャンAIは、AIと会話をしながら算数を学べるサービスです
          </p>
        </div>

        <div className="mb-6 space-y-2">
          <h3 className="text-gray-800 font-bold">音声のセットアップ(必須)</h3>
          <p className="text-gray-600">
            ジャンジャンAI利用するにはマイクが必要です。マイクを有効にしてください。
          </p>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className="rounded-xl px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined filled">mic</span>
              {isRecording ? "マイクを停止する" : "マイクを有効にする"}
            </button>
            <div className={c("flex items-center gap-2", { "opacity-30": !isRecording })}>
              <div className="border py-4 p-2 border-gray-300 rounded-xl flex items-center">
                <AudioPulse volume={volume} active={isRecording} hover={false} />
              </div>
              <p className="text-gray-500 text-xs">音声が認識されると波形が動きます。</p>
            </div>
          </div>
        </div>
        <div className="mb-6 space-y-2">
          <h3 className="text-gray-800 font-bold">カメラのセットアップ</h3>
          <div className="space-y-1 mb-4">
            <p className="text-gray-600">カメラをオンにすると、話しかけモードを利用できます。</p>
            <p className="text-gray-500 text-xs">
              話しかけモードとは、カメラの前に顔を認識すると、AIの方から話かけてくれるモードです
            </p>
          </div>
          <WebCamera className="mb-6" />
        </div>
        <div className="text-center">{children}</div>
      </div>
    </div>
  );
}
