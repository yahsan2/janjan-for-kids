# JanJan for kids
[web demo](https://janjan-for-kids.web.app)

開始ボタンを押してから、会話までに最初時間がかかる場合があります。
またMultimodal Live API の同時接続数制限が3なので、動かない場合はこちらになっている可能性があります。

#### Backend Setup
1. **Set your default Google Cloud project and region:**
   ```bash
   export PROJECT_ID="janjan-for-kids"

   gcloud auth login --update-adc
   gcloud config set project $PROJECT_ID
   gcloud auth application-default set-quota-project $PROJECT_ID
   ```
2. **Install Dependencies:**
   Install the required Python packages using Poetry:

   ```bash
   poetry install
   ```

3. **Run the Backend Server:**
   Start the FastAPI server:

   ```bash
   poetry run uvicorn app.server:app --host 0.0.0.0 --port 8000 --reload
   ```

#### Frontend Setup
1. **Install Dependencies:**

   In a separate terminal, install the required Node.js packages for the frontend:

   ```bash
   npm --prefix frontend install
   ```

2. **Start the Frontend:**

   Launch the React development server:

   ```bash
   npm --prefix frontend start
   ```

   This command starts the frontend application, accessible at `http://localhost:3000`.


#### Remote deployment in Cloud Run

You can quickly test the application in [Cloud Run](https://cloud.google.com/run). Ensure your service account has the `roles/aiplatform.user` role to access Gemini.

1. **Deploy:**

   ```bash
   export REGION="us-central1"

   gcloud run deploy janjan-for-kids \
     --source . \
     --project $PROJECT_ID \
     --memory "4Gi" \
     --region $REGION \
     --port 8080
   ```

2. **Access:** Use [Cloud Run proxy](https://cloud.google.com/sdk/gcloud/reference/run/services/proxy) for local access. The backend will be accessible at `http://localhost:8000`:

   ```bash
   gcloud run services proxy genai-app-sample --port 8000 --project $PROJECT_ID --region $REGION
   ```

   You can then use the same frontend setup described above to interact with your Cloud Run deployment.
