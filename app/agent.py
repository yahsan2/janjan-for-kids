# Copyright 2024 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
from typing import Dict
from dotenv import load_dotenv

# 環境変数を確実に読み込む
load_dotenv(override=True)

from app.templates import FORMAT_DOCS, SYSTEM_INSTRUCTION
from app.vector_store import get_vector_store
import google
from google import genai
from google.genai.types import Content, FunctionDeclaration, LiveConnectConfig, Tool
from langchain_google_vertexai import VertexAIEmbeddings
import vertexai

# Constants
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.getenv("GOOGLE_CLOUD_REGION")
EMBEDDING_MODEL = "text-embedding-004"

if not PROJECT_ID or not LOCATION:
    raise ValueError(
        "GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_REGION must be set in environment variables"
    )

MODEL_ID = "gemini-2.0-flash-exp"
URLS = [
    "https://cloud.google.com/architecture/deploy-operate-generative-ai-applications"
]

# Initialize Google Cloud clients
credentials, project = google.auth.default()

vertexai.init(project=PROJECT_ID, location=LOCATION, credentials=credentials)
genai_client = genai.Client(
    project=PROJECT_ID,
    location=LOCATION,
    credentials=credentials,
    vertexai=True
)

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


# Configure tools and live connection
retrieve_docs_tool = Tool(
    function_declarations=[
        FunctionDeclaration.from_function(client=genai_client, func=retrieve_docs)
    ]
)

tool_functions = {"retrieve_docs": retrieve_docs}

live_connect_config = LiveConnectConfig(
    response_modalities=["AUDIO"],
    tools=[retrieve_docs_tool],
    system_instruction=Content(parts=[{"text": SYSTEM_INSTRUCTION}]),
    speech_config={
        "voice_config": {
            "prebuilt_voice_config": {
                "voice_name": "Aoede"
            }
        }
    }
)
