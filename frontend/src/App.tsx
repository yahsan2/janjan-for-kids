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
import { useRef, useState } from "react";
import ControlTray from "./components/control-tray/ControlTray";
import SidePanel from "./components/side-panel/SidePanel";
import { WelcomeOverlay } from "./components/welcome-overlay";
import { ExpressionProvider } from "./contexts/ExpressionContext";
import { LiveAPIProvider } from "./contexts/LiveAPIContext";
import { StreamingProvider } from "./contexts/StreamingContext";
import { useConfig } from "./hooks/use-config";

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [runId] = useState<string>(crypto.randomUUID());
  const [userId, setUserId] = useState<string>("user1");
  const [isOpen, setIsOpen] = useState(true);
  const { wsUrl } = useConfig();

  return (
    <div className="App">
      <ExpressionProvider>
        <StreamingProvider>
          <LiveAPIProvider url={wsUrl} userId={userId}>
            <div className="streaming-console">
              <SidePanel />
              <main className="main-app-area">
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
                  videoRef={videoRef}
                  supportsVideo={true}
                  onVideoStreamChange={setVideoStream}
                />
                <div
                  className="url-setup"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    pointerEvents: "auto",
                    zIndex: 1000,
                    padding: "2px",
                    marginBottom: "2px",
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    background: "rgba(255, 255, 255, 0.9)",
                  }}
                >
                  <div>
                    <label htmlFor="user-id">User ID:</label>
                    <input
                      id="user-id"
                      type="text"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      placeholder="Enter user ID"
                      style={{
                        cursor: "text",
                        padding: "4px",
                        margin: "0 4px",
                        borderRadius: "2px",
                        border: "1px solid #ccc",
                        fontSize: "14px",
                        fontFamily: "system-ui, -apple-system, sans-serif",
                        width: "100px",
                      }}
                    />
                  </div>
                </div>
              </main>
            </div>
          </LiveAPIProvider>
        </StreamingProvider>
      </ExpressionProvider>
    </div>
  );
}

export default App;
