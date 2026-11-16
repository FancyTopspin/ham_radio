from ninja import NinjaAPI
from questions.api import router as questions_router
from core.api import router as auth_router
from study.api import router as study_router

api = NinjaAPI(
    title="Ham Radio Exam Prep API",
    version="1.0.0",
    description="Backend API for Amateur Radio License Study, Quota Mock Exams, and Sync",
)

api.add_router("/questions", questions_router)
api.add_router("/auth", auth_router)
api.add_router("/study", study_router)

@api.get("/health", tags=["Health"])
def health_check(request):
    return {
        "status": "healthy",
        "app": "Ham Radio License Exam Prep",
        "version": "1.0.0"
    }
