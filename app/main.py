from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="Spiritual Gifts Assessment")


@app.get("/health")
def health():
    return {"status": "ok"}


# Serve the static frontend (index.html at "/")
app.mount(
    "/",
    StaticFiles(directory=str(Path(__file__).parent / "static"), html=True),
    name="static",
)