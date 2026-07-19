import os
import uvicorn
from server import app

if __name__ == "__main__":
    # Hugging Face Spaces binds to the PORT variable (typically 7860)
    port = int(os.getenv("PORT", 7860))
    # Launch the FastAPI app directly
    uvicorn.run("server:app", host="0.0.0.0", port=port)
