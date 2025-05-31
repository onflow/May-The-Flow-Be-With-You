import asyncio
import os
from openai import AsyncOpenAI
from database import get_session, init_db
from models import TVSerial, Question, Option, Difficulty, OptionKey
from sqlalchemy import select
from typing import List, Dict
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get OpenAI API key from environment
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY not found in environment variables. Please check your .env file.")

# Initialize OpenAI client
client = AsyncOpenAI(api_key=api_key)

async def generate_questions(tv_serial_id: int, num_questions: int = 10) -> List[Dict]:
    """Generate questions using OpenAI API"""
    prompt = """You are a trivia expert specializing in TV shows. Generate {num_questions} trivia questions about Breaking Bad TV series.
    
    Each question must have:
    1. A question text
    2. A difficulty level (easy, medium, or hard)
    3. A score (1-5)
    4. Four options (A, B, C, D)
    5. One correct option (A, B, C, or D)
    
    Return the response as a JSON object with a 'questions' array containing the questions.
    Each question in the array must follow this exact structure:
    {{
        "question": "question text",
        "difficulty": "easy/medium/hard",
        "score": 1-5,
        "options": {{
            "A": "option A text",
            "B": "option B text",
            "C": "option C text",
            "D": "option D text"
        }},
        "correct_option": "A/B/C/D"
    }}
    
    Make sure questions are diverse and cover different aspects of the show."""

    try:
        response = await client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "You are a trivia expert specializing in TV shows. Always return valid JSON with a 'questions' array."},
                {"role": "user", "content": prompt.format(num_questions=num_questions)}
            ],
            response_format={"type": "json_object"}
        )

        # Parse the response
        content = response.choices[0].message.content
        try:
            data = json.loads(content)
            if not isinstance(data, dict):
                raise ValueError("Response is not a JSON object")
            
            if "questions" not in data:
                raise ValueError("Response does not contain 'questions' array")
            
            questions = data["questions"]
            if not isinstance(questions, list):
                raise ValueError("'questions' is not an array")
            
            # Validate each question
            for q in questions:
                if not all(k in q for k in ["question", "difficulty", "score", "options", "correct_option"]):
                    raise ValueError("Question missing required fields")
                if not all(k in q["options"] for k in ["A", "B", "C", "D"]):
                    raise ValueError("Question options missing required keys")
                if q["correct_option"] not in ["A", "B", "C", "D"]:
                    raise ValueError("Invalid correct_option value")
                if q["difficulty"] not in ["easy", "medium", "hard"]:
                    raise ValueError("Invalid difficulty value")
                if not isinstance(q["score"], int) or not 1 <= q["score"] <= 5:
                    raise ValueError("Invalid score value")
            
            return questions
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON response: {e}")
            print(f"Raw response: {content}")
            raise
    except Exception as e:
        print(f"Error generating questions: {str(e)}")
        raise

async def insert_questions(tv_serial_id: int, questions_data: List[Dict]):
    """Insert generated questions into the database"""
    async for session in get_session():
        try:
            for q_data in questions_data:
                # Create question
                question = Question(
                    question_text=q_data["question"],
                    tv_serial_id=tv_serial_id,
                    difficulty=Difficulty[q_data["difficulty"].upper()],
                    score=q_data["score"],
                    correct_option=OptionKey[q_data["correct_option"]]
                )
                session.add(question)
                await session.flush()  # Get the question ID

                # Create options
                for key, text in q_data["options"].items():
                    option = Option(
                        question_id=question.id,
                        option_key=OptionKey[key],
                        option_text=text
                    )
                    session.add(option)

            await session.commit()
            print("Questions inserted successfully!")
        except Exception as e:
            await session.rollback()
            print(f"Error inserting questions: {str(e)}")
            raise

async def main():
    try:
        # Initialize database
        await init_db()

        async for session in get_session():
            # Check if Breaking Bad already exists
            result = await session.execute(
                select(TVSerial).where(TVSerial.title == "Breaking Bad")
            )
            tv_serial = result.scalar_one_or_none()

            if not tv_serial:
                # Create Breaking Bad TV serial
                tv_serial = TVSerial(title="Breaking Bad")
                session.add(tv_serial)
                await session.commit()
                await session.refresh(tv_serial)
                print("Created Breaking Bad TV serial entry")

            # Generate and insert questions
            print("Generating questions...")
            questions_data = await generate_questions(tv_serial.id)
            await insert_questions(tv_serial.id, questions_data)
            print(f"Successfully generated and inserted {len(questions_data)} questions for Breaking Bad")
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(main()) 