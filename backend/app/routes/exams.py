from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.dependencies.auth import get_current_faculty, get_current_student
from app.services import exam_service


student_exam_router = APIRouter(prefix="/student/exams", tags=["Student Exams"])
faculty_exam_router = APIRouter(prefix="/faculty/exams", tags=["Faculty Exams"])


class ExamQuestionSchema(BaseModel):
    id: str = Field(default_factory=lambda: uuid4().hex, min_length=1, max_length=64, pattern=r"^[a-zA-Z0-9_-]+$")
    prompt: str = Field(min_length=5, max_length=5000)
    type: Literal["multiple_choice", "short_answer", "essay", "coding"]
    options: list[str] = Field(default_factory=list, max_length=8)
    correct_answer: str | None = Field(default=None, max_length=2000)
    language: Literal["python", "c", "java"] | None = None
    starter_code: str = Field(default="", max_length=20000)
    points: int = Field(default=1, ge=1, le=100)

    model_config = ConfigDict(extra="forbid")

    @field_validator("prompt")
    @classmethod
    def normalize_prompt(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 5:
            raise ValueError("Question prompt must contain at least five non-space characters")
        return value

    @model_validator(mode="after")
    def validate_question(self):
        if self.type == "multiple_choice":
            self.options = [option.strip() for option in self.options if option.strip()]
            if len(self.options) < 2:
                raise ValueError("Multiple-choice questions need at least two options")
            if not self.correct_answer or self.correct_answer not in self.options:
                raise ValueError("Choose one of the options as the correct answer")
        else:
            self.options = []
            self.correct_answer = None
        if self.type == "coding":
            self.language = self.language or "python"
        else:
            self.language = None
            self.starter_code = ""
        return self


class ExamCreateSchema(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    course_id: str = Field(min_length=1, max_length=64)
    duration_minutes: int = Field(ge=1, le=300)
    questions: list[ExamQuestionSchema] = Field(min_length=1, max_length=40)

    model_config = ConfigDict(extra="forbid")

    @model_validator(mode="after")
    def validate_unique_question_ids(self):
        question_ids = [question.id for question in self.questions]
        if len(question_ids) != len(set(question_ids)):
            raise ValueError("Question IDs must be unique")
        return self

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 3:
            raise ValueError("Exam title must contain at least three non-space characters")
        return value

    @field_validator("course_id")
    @classmethod
    def normalize_course_id(cls, value: str) -> str:
        return value.strip().lower()


class AnswerSchema(BaseModel):
    question_id: str = Field(min_length=1, max_length=64)
    answer: str = Field(max_length=20000)

    model_config = ConfigDict(extra="forbid")


class ExamRunSchema(BaseModel):
    language: Literal["python", "c", "java"]
    code: str = Field(max_length=20000)
    stdin: str = Field(default="", max_length=20000)

    model_config = ConfigDict(extra="forbid")


class FocusViolationSchema(BaseModel):
    kind: Literal["tab_hidden", "window_blur", "fullscreen_exit"]

    model_config = ConfigDict(extra="forbid")


class ExamGradeSchema(BaseModel):
    scores: dict[str, float] = Field(default_factory=dict, allow_inf_nan=False)
    feedback: str = Field(default="", max_length=5000)

    model_config = ConfigDict(extra="forbid")


@student_exam_router.get("")
async def get_student_exams(current_student: dict = Depends(get_current_student)):
    return {"status": "success", "data": await exam_service.list_student_exams(current_student)}


@student_exam_router.get("/{exam_id}")
async def get_student_exam_room(exam_id: str, current_student: dict = Depends(get_current_student)):
    return {"status": "success", "data": await exam_service.get_student_exam_room(exam_id, current_student)}


@student_exam_router.post("/{exam_id}/start")
async def start_student_exam(exam_id: str, current_student: dict = Depends(get_current_student)):
    return {"status": "success", "data": await exam_service.start_student_attempt(exam_id, current_student)}


@student_exam_router.put("/{exam_id}/answer")
async def save_student_exam_answer(
    exam_id: str,
    payload: AnswerSchema,
    current_student: dict = Depends(get_current_student),
):
    result = await exam_service.save_student_answer(
        exam_id,
        current_student,
        payload.question_id,
        payload.answer,
    )
    return {"status": "success", "data": result}


@student_exam_router.post("/{exam_id}/questions/{question_id}/run")
async def run_exam_question_code(
    exam_id: str,
    question_id: str,
    payload: ExamRunSchema,
    current_student: dict = Depends(get_current_student),
):
    await exam_service.ensure_exam_code_execution(
        exam_id, question_id, current_student, payload.language
    )
    from app.services.judge0_service import execute_code

    result = await execute_code(
        student_id=str(current_student["_id"]),
        language=payload.language,
        code=payload.code,
        stdin=payload.stdin,
    )
    return {"status": "success", "data": result}


@student_exam_router.post("/{exam_id}/violations")
async def record_exam_focus_violation(
    exam_id: str,
    payload: FocusViolationSchema,
    current_student: dict = Depends(get_current_student),
):
    result = await exam_service.record_focus_violation(exam_id, current_student, payload.kind)
    return {"status": "success", "data": result}


@student_exam_router.post("/{exam_id}/submit")
async def submit_student_exam(exam_id: str, current_student: dict = Depends(get_current_student)):
    return {"status": "success", "data": await exam_service.submit_student_attempt(exam_id, current_student)}


@faculty_exam_router.get("")
async def get_faculty_exams(current_faculty: dict = Depends(get_current_faculty)):
    return {"status": "success", "data": await exam_service.list_faculty_exams(current_faculty)}


@faculty_exam_router.post("")
async def create_faculty_exam(
    payload: ExamCreateSchema,
    current_faculty: dict = Depends(get_current_faculty),
):
    exam = await exam_service.create_faculty_exam(current_faculty, payload.model_dump())
    return {"status": "success", "message": "Exam published", "data": exam}


@faculty_exam_router.get("/{exam_id}/attempts")
async def get_faculty_exam_attempts(
    exam_id: str,
    current_faculty: dict = Depends(get_current_faculty),
):
    attempts = await exam_service.list_exam_attempts(exam_id, current_faculty)
    return {"status": "success", "data": attempts}


@faculty_exam_router.put("/{exam_id}/attempts/{attempt_id}/grade")
async def grade_faculty_exam_attempt(
    exam_id: str,
    attempt_id: str,
    payload: ExamGradeSchema,
    current_faculty: dict = Depends(get_current_faculty),
):
    attempt = await exam_service.grade_exam_attempt(
        exam_id,
        attempt_id,
        current_faculty,
        payload.scores,
        payload.feedback,
    )
    return {"status": "success", "message": "Assessment saved", "data": attempt}
