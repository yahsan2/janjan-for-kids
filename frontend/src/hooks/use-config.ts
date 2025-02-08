/**
 * このフックは、現在の環境に基づいて設定値を返します。
 * 現在は、バックエンドのURL (backendUrl) のみを返しています。
 *
 * - 開発環境 (development) では、環境変数 REACT_APP_BACKEND_URL の値がなければ
 *   デフォルトで 'http://localhost:5000' を使用します。
 * - それ以外の環境では、同じ環境変数がなければ 'https://api.production.example.com'
 *   を使用します。
 */

import { useMemo } from "react";

interface Config {
  wsUrl: string;
  isDev: boolean;
}

export function useConfig(): Config {
  return useMemo(() => {
    let wsUrl: string;

    const isDev = process.env.NODE_ENV === "development";

    if (isDev) {
      // 開発環境の場合、ローカルのバックエンドURLを使用
      wsUrl = "ws://localhost:8000/ws";
    } else {
      // 本番環境などの場合、プロダクション用のバックエンドURLを使用
      wsUrl = "wss://janjan-for-kids-793388034611.us-central1.run.app/ws";
    }

    return { wsUrl, isDev };
  }, []);
}
