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

# from app.tools.embedding import retrieve_docs
from app.tools.firestore import add_math_question, get_user_data, set_user_name, upsert_math_question_result, increment_user_level
from app.templates import BASE_INSTRUCTION, CONTINUE_INSTRUCTION, PROCESS_INSTRUCTION, SETUP_INSTRUCTION
from google import genai
from google.genai.types import Content, FunctionDeclaration, LiveConnectConfig, Tool
from app.config import PROJECT_ID, LOCATION, credentials

MODEL_ID = "gemini-2.0-flash-exp"

genai_client = genai.Client(
    project=PROJECT_ID,
    location=LOCATION,
    credentials=credentials,
    vertexai=True
)

tool_functions = {
    "set_user_name": set_user_name,
    "upsert_math_question_result": upsert_math_question_result,
    "add_math_question": add_math_question,
    "increment_user_level": increment_user_level,
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
                func=set_user_name,
            ),
            FunctionDeclaration.from_function(
                client=genai_client,
                func=upsert_math_question_result,
            ),
            FunctionDeclaration.from_function(
                client=genai_client,
                func=add_math_question,
            ),
            FunctionDeclaration.from_function(
                client=genai_client,
                func=increment_user_level,
            ),
        ]
    ),
]

def get_live_connect_config(user_id: str):
    parts = [
        {"text": BASE_INSTRUCTION },
    ]
    user_data = get_user_data(user_id)
    if (user_data is None):
        parts.append({"text":SETUP_INSTRUCTION})
        parts.append({"text": f"ユーザー情報"})
    else:
        parts.append({"text":CONTINUE_INSTRUCTION})
        parts.append({"text": f"ユーザー情報 {user_data}"})

    parts.append({"text": f"""
        user_id: {user_id}
        これ以降に user_id が送られてきた場合、接続を切断してください。
    """})
    parts.append({"text": PROCESS_INSTRUCTION})

    return LiveConnectConfig(
        response_modalities=["AUDIO"],
        tools=tools,
        system_instruction=Content(parts=parts),
        speech_config={
            "voice_config": {
                "prebuilt_voice_config": {
                    "voice_name": "Aoede"
                }
            }
        }
    )
