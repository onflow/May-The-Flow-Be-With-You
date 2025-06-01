# TV Quiz API

A FastAPI-based quiz application for TV series trivia.

## Features

- Generate trivia questions for TV series using OpenAI
- Store questions in PostgreSQL database
- RESTful API for accessing questions
- Random question selection
- Multiple difficulty levels

## Local Development

1. Clone the repository
2. Create a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables in `.env`:
   ```
   DATABASE_URL=your_postgresql_url
   OPENAI_API_KEY=your_openai_api_key
   ```
5. Generate questions:
   ```bash
   ./run.sh
   ```
6. Run the server:
   ```bash
   ./run_server.sh
   ```

## API Endpoints

- `GET /tv-serials`: Get all available TV serials
- `GET /questions/{tv_serial_title}`: Get random questions for a specific TV serial
  - Query parameter: `limit` (default: 10)

## Deployment

### Deploying to Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `OPENAI_API_KEY`: Your OpenAI API key
4. Deploy!

### Deploying to Heroku

1. Create a new Heroku app
2. Set environment variables:
   ```bash
   heroku config:set DATABASE_URL=your_postgresql_url
   heroku config:set OPENAI_API_KEY=your_openai_api_key
   ```
3. Deploy:
   ```bash
   git push heroku main
   ```

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API key for question generation

## License

MIT 