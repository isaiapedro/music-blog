# Project Summary & Memory Anchor

## Tech Stack
- Backend: Spring Boot / Python API (Local port 8080)
- Database: PostgreSQL (Local port 5432)
- Infrastructure: Local Docker containers

## Core Directory Structure
- `src/main/` : Main application code and REST endpoints
- `infra/docker-compose.yml` : Multi-container configurations
- `infra/db/schema.sql` : Data definition language (DDL) baseline

## Database Schema Reference
> Always respect this relational topology when writing queries or adjusting entities:
- **users** (id SERIAL PRIMARY KEY, username VARCHAR, email VARCHAR UNIQUE)
- **data_logs** (id BIGSERIAL PRIMARY KEY, user_id INT REFERENCES users(id), payload JSONB, created_at TIMESTAMP)

## Local API Contracts
- `GET http://localhost:8080/api/v1/health` -> Returns status monitoring payload
- `POST http://localhost:8080/api/v1/telemetry` -> Consumes real-time JSON stream data