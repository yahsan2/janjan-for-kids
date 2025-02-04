import { useExpression } from "../contexts/ExpressionContext"
import { ModelViewer } from "./model-viewer"

export function ModelContainer() {
  const { expressionKey } = useExpression()
  return <ModelViewer className="absolute w-full h-full" expression={expressionKey} />
}
