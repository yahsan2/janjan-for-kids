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
from app.tools.embedding import retrieve_docs
from app.tools.firestore import get_user_level, set_user_name
from dotenv import load_dotenv
from app.templates import FORMAT_DOCS, SYSTEM_INSTRUCTION
import google
from google import genai
from google.genai.types import Content, FunctionDeclaration, LiveConnectConfig, Tool
import vertexai

# 環境変数を確実に読み込む
load_dotenv(override=True)

# Initialize Google Cloud clients
credentials, project = google.auth.default()

# Constants
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", project)
LOCATION = os.getenv("GOOGLE_CLOUD_REGION", "us-central1")

if not PROJECT_ID or not LOCATION:
    raise ValueError(
        "GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_REGION must be set in environment variables"
    )

MODEL_ID = "gemini-2.0-flash-exp"

vertexai.init(project=PROJECT_ID, location=LOCATION, credentials=credentials)
genai_client = genai.Client(
    project=PROJECT_ID,
    location=LOCATION,
    credentials=credentials,
    vertexai=True
)


tool_functions = {
    "retrieve_docs": retrieve_docs,
    "get_user_level": get_user_level,
    "set_user_name": set_user_name,
}

# Create tool declarations
tools = [
    # Tool(
    #     function_declarations=[
    #         FunctionDeclaration.from_function(
    #             client=genai_client,
    #             func=retrieve_docs,
    #         ),
    #     ]
    # ),
    Tool(
        function_declarations=[
            FunctionDeclaration.from_function(
                client=genai_client,
                func=get_user_level,
            ),
            FunctionDeclaration.from_function(
                client=genai_client,
                func=set_user_name,
            )
        ]
    ),
]

live_connect_config = LiveConnectConfig(
    response_modalities=["AUDIO"],
    tools=tools,
    system_instruction=Content(parts=[{"text": SYSTEM_INSTRUCTION}]),
    speech_config={
        "voice_config": {
            "prebuilt_voice_config": {
                "voice_name": "Aoede"
            }
        }
    }
)
