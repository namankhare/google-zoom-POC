# Zoom AI Companion CRM Integration - Backend PoC

This is the backend component of the Zoom CRM PoC. It handles Zoom webhooks, retrieves meeting summaries, and stores them in a local SQLite database.

## Prerequisites

- Node.js 22+
- Zoom Server-to-Server OAuth App
- Zoom Webhook Secret

## Setup

1. Copy `.env` and fill in the values:
   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Initialize the database:
   ```bash
   npx prisma migrate dev
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Endpoints

- `POST /webhooks/zoom`: Zoom Webhook endpoint.
- `GET /meetings`: List all processed meetings.
- `GET /meetings/:meetingId`: Get meeting details and mapping.
- `GET /webhooks`: List stored webhook events.
- `GET /mappings`: List meeting mappings.
