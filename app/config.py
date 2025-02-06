import os
import google.auth
import vertexai
from dotenv import load_dotenv

# Initialize Google Cloud clients
credentials, project = google.auth.default()

load_dotenv(override=True)

# Constants
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", project)
LOCATION = os.getenv("GOOGLE_CLOUD_REGION", "us-central1")
URLS = [
    "https://cloud.google.com/architecture/deploy-operate-generative-ai-applications"
]

if not PROJECT_ID or not LOCATION:
    raise ValueError(
        "GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_REGION must be set in environment variables"
    )

# Initialize Vertex AI
vertexai.init(project=PROJECT_ID, location=LOCATION, credentials=credentials)
