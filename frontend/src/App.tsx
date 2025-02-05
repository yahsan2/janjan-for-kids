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
import cn from "classnames";
import { useRef, useState, useEffect } from "react";
import ControlTray from "./components/control-tray/ControlTray";
import SidePanel from "./components/side-panel/SidePanel";
import { WelcomeOverlay } from "./components/welcome-overlay";
import { ExpressionProvider, useExpression } from "./contexts/ExpressionContext";
import { LiveAPIProvider } from "./contexts/LiveAPIContext";
import { StreamingProvider } from "./contexts/StreamingContext";
import { useConfig } from "./hooks/use-config";
import { useAuth } from "./hooks/use-auth";
import { ModelContainer } from "./components/model-viewer-container";

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [runId] = useState<string>(crypto.randomUUID());
  const [isOpen, setIsOpen] = useState(true);
  const { isDev } = useConfig();

  useExpression({
    onFaceDetected: () => {
      console.log("顔を検出しました！!!!");
    },
    onFaceDisappeared: () => {
      console.log("顔を検出しませんでした");
    }
  })

  return (
    <div className="App">
      <div className="streaming-console">
        {isDev && <SidePanel />}
        <main className="main-app-area">
          <ModelContainer />
          {isOpen && (
            <WelcomeOverlay>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                始める
              </button>
            </WelcomeOverlay>
          )}

          <div className="main-app-area">
            <video
              className={cn("stream", {
                hidden: !videoRef.current || !videoStream,
              })}
              ref={videoRef}
              autoPlay
              playsInline
            />
          </div>
          <ControlTray
            videoRef={videoRef as React.RefObject<HTMLVideoElement>}
            supportsVideo={true}
            onVideoStreamChange={setVideoStream}
          />
        </main>
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
  }, []);

  return (
    <LiveAPIProvider url={wsUrl} userId={user?.uid}>
      <ExpressionProvider>
        <StreamingProvider>
          <App />
        </StreamingProvider>
      </ExpressionProvider>
    </LiveAPIProvider>
  );
}

export default AppProvider;
