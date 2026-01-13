from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Cấu hình CORS (Quan trọng để Next.js gọi được Backend)
# Hiện tại cho phép tất cả (*), khi deploy thật sẽ chặn bớt sau.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI Backend!"}

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "workout-bird-backend"}