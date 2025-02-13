/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import "./App.scss";
import { useEffect, useRef, useState } from "react";
import ControlTray from "./components/control-tray/ControlTray";
import { CurrentQuestion } from "./components/current-question";
import { ModelContainer } from "./components/model-viewer-container";
import SidePanel from "./components/side-panel/SidePanel";
import { WelcomeOverlay } from "./components/welcome-overlay";
import { AudioProvider, useAudio } from "./contexts/AudioContext";
import { ExpressionProvider, useExpression } from "./contexts/ExpressionContext";
import { LiveAPIProvider, useLiveAPIContext } from "./contexts/LiveAPIContext";
import { StreamingProvider } from "./contexts/StreamingContext";
import { useAuth } from "./hooks/use-auth";
import { useConfig } from "./hooks/use-config";
import { useFirestore } from "./hooks/use-firestore";

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isRecording } = useAudio();
  const { isDev } = useConfig();
  const { user, getIdToken, signInAnonymousUser } = useAuth();
  const { loading: userDataLoading } = useFirestore(user?.uid);

  const [isStarted, setIsStarted] = useState(false);
  const { connect, disconnect, connected, client, getDisconnectionDuration } = useLiveAPIContext();

  useExpression({
    onFaceDetected: async () => {
      // 初回開始されていない場合、または、ws接続が継続中の場合、何もしない。
      if (!isStarted || connected) return;

      const duration = getDisconnectionDuration();
      // ws接続が切れた時間から、1分以上経っていたなら
      if (duration > 15 * 60 * 1000) {
        await signInAnonymousUser();
        const idToken = await getIdToken();
        connect(idToken);
      }
    },
    onFaceDisappeared: () => {
      // 初回開始されていない場合、または、ws接続して"ない"場合、何もしない。
      if (!isStarted || !connected) return;

      // faceDisappearedの状態が 1分以上続いたら, 接続を切る
      const timeoutId = setTimeout(() => {
        disconnect();
      }, 60 * 1000);

      // Clean up timeout if face is detected again
      return () => clearTimeout(timeoutId);
    },
  });

  const handleClickStartButton = async () => {
    if (!user?.uid || connected) return;
    setIsStarted(true);

    const idToken = await getIdToken();
    await connect(idToken);

    client.send([{ text: "こんにちは！算数のお勉強をしましょう！" }]);
  };

  return (
    <div className="App">
      <div className="streaming-console">
        <ModelContainer />
        <ControlTray
          videoRef={videoRef as React.RefObject<HTMLVideoElement>}
          supportsVideo={false}
        />
        <CurrentQuestion isStarted={isStarted} />
        {!isStarted && (
          <WelcomeOverlay className="fixed inset-0">
            <div className="space-y-2">
              <button
                disabled={userDataLoading || !isRecording}
                type="button"
                onClick={() => handleClickStartButton()}
                className="px-6 py-3 rounded-lg transition-colors bg-blue-500 hover:enabled:bg-blue-600 text-white disabled:bg-gray-400 disabled:text-gray-300 disabled:cursor-not-allowed"
              >
                始める
              </button>
              {!isRecording ? (
                <p className="text-gray-500 text-xs">音声を有効にすると開始できます。</p>
              ) : (
                <p className="text-gray-500 text-xs">
                  「始める」の後、会話開始まで数秒かかることがあります。しばらくお待ちください。
                  <br />
                  それでも繋がらない場合、現在利用の実験的モデルが、 <br />
                  同時接続数が 3 となっているため、時間をおいて再度お試しください。
                </p>
              )}
            </div>
          </WelcomeOverlay>
        )}
        {isDev && <SidePanel className="absolute left-0 h-full" />}
      </div>
    </div>
  );
}

function AppProvider() {
  const { wsUrl } = useConfig();
  const { user, signInAnonymousUser } = useAuth();

  useEffect(() => {
    // 初回マウント時に匿名ログインを実行
    signInAnonymousUser();
  }, [signInAnonymousUser]);

  return (
    <LiveAPIProvider url={wsUrl} userId={user?.uid}>
      <ExpressionProvider>
        <StreamingProvider>
          <AudioProvider>
            <App />
          </AudioProvider>
        </StreamingProvider>
      </ExpressionProvider>
    </LiveAPIProvider>
  );
}

export default AppProvider;
