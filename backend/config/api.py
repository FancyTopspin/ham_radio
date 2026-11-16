from ninja import NinjaAPI

api = NinjaAPI(
    title="Ham Radio Exam Prep API",
    version="1.0.0",
    description="Backend API for Amateur Radio License Study, Quota Mock Exams, and Sync"
)

@api.get("/health", tags=["Health"])
def health_check(request):
    return {
        "status": "healthy",
        "app": "Ham Radio License Exam Prep",
        "version": "1.0.0"
    }
