from app.vector_store import get_vector_store
from langchain_google_vertexai import VertexAIEmbeddings

EMBEDDING_MODEL = "text-embedding-004"
URLS = [
    "https://cloud.google.com/architecture/deploy-operate-generative-ai-applications"
]
# Initialize vector store and retriever
embedding = VertexAIEmbeddings(model_name=EMBEDDING_MODEL)
vector_store = get_vector_store(embedding=embedding, urls=URLS)
retriever = vector_store.as_retriever()

def retrieve_docs(query: str) -> Dict[str, str]:
    """
    Retrieves pre-formatted documents about MLOps (Machine Learning Operations),
      Gen AI lifecycle, and production deployment best practices.

    Args:
        query: Search query string related to MLOps, Gen AI, or production deployment.

    Returns:
        A set of relevant, pre-formatted documents.
    """
    docs = retriever.invoke(query)
    formatted_docs = FORMAT_DOCS.format(docs=docs)
    return {"output": formatted_docs}
