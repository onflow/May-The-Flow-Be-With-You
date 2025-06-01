from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import random

from database import get_session, init_db
from models import Question, Option, TVSerial

app = FastAPI(title="TV Quiz API")

# Add CORS middleware with updated origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Development
        "http://localhost:5174",  # Development
        "http://localhost:3000",  # Development
        "https://breaking-bad-front.vercel.app",  # Production frontend
        "https://breaking-bad-fastapi.onrender.com"  # Production API
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await init_db()

@app.get("/questions/{tv_serial_title}", response_model=List[dict])
async def get_questions(
    tv_serial_title: str,
    limit: int = 10,
    session: AsyncSession = Depends(get_session)
):
    """
    Get random questions for a specific TV serial.
    """
    # Get TV serial
    result = await session.execute(
        select(TVSerial).where(TVSerial.title == tv_serial_title)
    )
    tv_serial = result.scalar_one_or_none()
    
    if not tv_serial:
        raise HTTPException(status_code=404, detail=f"TV serial '{tv_serial_title}' not found")
    
    # Get all questions for the TV serial
    result = await session.execute(
        select(Question).where(Question.tv_serial_id == tv_serial.id)
    )
    questions = result.scalars().all()
    
    if not questions:
        raise HTTPException(status_code=404, detail=f"No questions found for '{tv_serial_title}'")
    
    # Randomly select questions
    selected_questions = random.sample(questions, min(limit, len(questions)))
    
    # Get options for selected questions
    questions_with_options = []
    for question in selected_questions:
        result = await session.execute(
            select(Option).where(Option.question_id == question.id)
        )
        options = result.scalars().all()
        
        # Format options as a dictionary
        options_dict = {opt.option_key: opt.option_text for opt in options}
        
        questions_with_options.append({
            "id": question.id,
            "question": question.question_text,
            "difficulty": question.difficulty,
            "score": question.score,
            "options": options_dict,
            "correct_option": question.correct_option
        })
    
    return questions_with_options

@app.get("/tv-serials", response_model=List[dict])
async def get_tv_serials(session: AsyncSession = Depends(get_session)):
    """
    Get all available TV serials.
    """
    result = await session.execute(select(TVSerial))
    tv_serials = result.scalars().all()
    
    return [{"id": ts.id, "title": ts.title} for ts in tv_serials] 