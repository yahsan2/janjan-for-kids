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

import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AudioStreamer } from "../utils/audio-streamer";
import { MultimodalLiveClient } from "../utils/multimodal-live-client";
import { audioContext } from "../utils/utils";
import VolMeterWorket from "../utils/worklets/vol-meter";

export type UseLiveAPIResults = {
  client: MultimodalLiveClient;
  connected: boolean;
  connect: (idToken?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  volume: number;
  getConnectionDuration: () => number;
  getDisconnectionDuration: () => number;
};

export type UseLiveAPIProps = {
  url?: string;
  userId?: string;
  onRunIdChange?: Dispatch<SetStateAction<string>>;
};

export function useLiveAPI({ url, userId }: UseLiveAPIProps): UseLiveAPIResults {
  const client = useMemo(() => new MultimodalLiveClient({ url, userId }), [url, userId]);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);

  const [connected, setConnected] = useState(false);
  const [volume, setVolume] = useState(0);
  const [connectionStartTime, setConnectionStartTime] = useState<number | null>(null);
  const [disconnectionTime, setDisconnectionTime] = useState<number | null>(null);

  // register audio for streaming server -> speakers
  useEffect(() => {
    if (!audioStreamerRef.current) {
      audioContext({ id: "audio-out" }).then((audioCtx: AudioContext) => {
        audioStreamerRef.current = new AudioStreamer(audioCtx);
        audioStreamerRef.current
          .addWorklet<any>("vumeter-out", VolMeterWorket, (ev: any) => {
            setVolume(ev.data.volume);
          })
          .then(() => {
            // Successfully added worklet
          });
      });
    }
  }, [audioStreamerRef]);

  useEffect(() => {
    const onClose = () => {
      setConnected(false);
      setDisconnectionTime(Date.now());
    };

    const stopAudioStreamer = () => audioStreamerRef.current?.stop();

    const onAudio = (data: ArrayBuffer) => audioStreamerRef.current?.addPCM16(new Uint8Array(data));

    client.on("close", onClose).on("interrupted", stopAudioStreamer).on("audio", onAudio);

    return () => {
      client.off("close", onClose).off("interrupted", stopAudioStreamer).off("audio", onAudio);
    };
  }, [client]);

  const connect = useCallback(
    async (idToken?: string) => {
      client.disconnect();
      await client.connect(idToken);
      setConnected(true);
      setConnectionStartTime(Date.now());
      setDisconnectionTime(null);
    },
    [client, setConnected]
  );

  const disconnect = useCallback(async () => {
    client.disconnect();
    setConnected(false);
    setConnectionStartTime(null);
    setDisconnectionTime(Date.now());
  }, [setConnected, client]);

  const getConnectionDuration = useCallback(() => {
    return connectionStartTime ? Date.now() - connectionStartTime : 0;
  }, [connectionStartTime]);

  /**
   * 切断からの経過時間をミリ秒(ms)で取得
   */
  const getDisconnectionDuration = useCallback(() => {
    return disconnectionTime ? Date.now() - disconnectionTime : 0;
  }, [disconnectionTime]);

  return {
    client,
    connected,
    connect,
    disconnect,
    volume,
    /**
     * 現在の接続時間をミリ秒(ms)で取得
     */
    getConnectionDuration,
    /**
     * 切断からの経過時間をミリ秒(ms)で取得
     */
    getDisconnectionDuration,
  };
}
