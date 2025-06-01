from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from enum import Enum

class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class OptionKey(str, Enum):
    A = "A"
    B = "B"
    C = "C"
    D = "D"

class TVSerial(SQLModel, table=True):
    __tablename__ = "tv_serials"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(unique=True, index=True)
    
    # Relationships
    questions: List["Question"] = Relationship(back_populates="tv_serial")

class Question(SQLModel, table=True):
    __tablename__ = "questions"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    question_text: str
    tv_serial_id: int = Field(foreign_key="tv_serials.id")
    difficulty: Difficulty
    score: int = Field(ge=0)
    correct_option: OptionKey
    
    # Relationships
    tv_serial: TVSerial = Relationship(back_populates="questions")
    options: List["Option"] = Relationship(back_populates="question")
    user_answers: List["UserAnswer"] = Relationship(back_populates="question")

class Option(SQLModel, table=True):
    __tablename__ = "options"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    question_id: int = Field(foreign_key="questions.id")
    option_key: OptionKey
    option_text: str
    
    # Relationships
    question: Question = Relationship(back_populates="options")

class User(SQLModel, table=True):
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    answers: List["UserAnswer"] = Relationship(back_populates="user")

class UserAnswer(SQLModel, table=True):
    __tablename__ = "user_answers"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    question_id: int = Field(foreign_key="questions.id")
    selected_option: OptionKey
    is_correct: bool
    answered_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    user: User = Relationship(back_populates="answers")
    question: Question = Relationship(back_populates="user_answers") 