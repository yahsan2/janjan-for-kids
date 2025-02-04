import type { ReactNode } from "react";
import { WebCamera } from "./web-camera";

export function WelcomeOverlay({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">ようこそ！</h2>
        </div>

        <WebCamera className="mb-6" />

        <div className="text-center">{children}</div>
      </div>
    </div>
  );
}
