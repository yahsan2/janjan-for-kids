import { useExpression } from "../contexts/ExpressionContext";
import { useLiveAPIContext } from "../contexts/LiveAPIContext";
import { ModelViewer } from "./model-viewer";

export function ModelContainer() {
  const { expressionKey } = useExpression();
  const { volume } = useLiveAPIContext();
  return (
    <ModelViewer className="absolute w-full h-full" expression={expressionKey} volume={volume} />
  );
}
