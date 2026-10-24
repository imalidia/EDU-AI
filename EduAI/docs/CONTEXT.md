# Edu AI: App Flow and Features

## Overview
Edu AI is an AI-powered educational tool that transforms learning content into accessible formats. It helps users:
- Generate structured notes from YouTube videos
- Create summaries from documents 
- Produce study flashcards
- Access an interactive AI chat for learning assistance
- Maintain motivation through a daily streak feature

Tech Stack:
Frontend: React Native with TypeScript, Expo, and Expo Router
Backend/Database: Supabase
UI Framework: React Native Paper
AI Processing: DeepSeek

## App Flow

### 1. Splash Screen
- Edu AI logo prominently displayed
- Brief tagline highlighting app benefits
- Sign Up and Login buttons

### 2. Authentication Page
- Edu AI logo at top
- "Create your account" text
- Authentication options:
  - Google Sign-Up/Login
  - Email Sign-Up/Login

### 3. Home Screen
- Edu AI logo at top
- Three feature tiles:
  - YouTube to Notes
  - Docs to Notes
  - Flashcards Generator
- Daily streak indicator (🔥) in top-right corner
- Bottom navigation:
  - Home (🏠) - Returns to main feature selection
  - Library (📚) - Access saved content
  - Profile (👤) - User settings and account details

### 4. YouTube to Notes Feature
- YouTube link input field
- AI processes video content
- Structured notes generation and display
- Save to library option
- AI chat bar for follow-up questions

### 5. Docs to Notes Feature
- Document upload functionality (PDF, Word, etc.)
- AI extracts key points
- Summarized notes display
- Save to library option
- AI chat bar for learning assistance

### 6. Flashcards Generator
- Text input field (or option to use generated notes)
- AI creates question-answer flashcards
- Flashcards display with save option

### 7. AI Chat Feature
- Available after notes generation
- Question input for content clarification
- AI provides explanations and additional insights

### 8. Library
- Centralized storage for saved notes and flashcards
- Edit, delete, and review functionality

### 9. Profile Page
- User information display
- Daily streak progress tracking (🔥)
- Settings for notifications, theme, and account management

## Summary
Edu AI streamlines the learning process by converting various content formats into structured, digestible information. The app encourages consistent use through its streak feature while maintaining easy access to all learning materials through its organized library system.

## Database Schema

### Users
```
users {
  id: uuid (PK)
  email: string (unique)
  display_name: string
  avatar_url: string (nullable)
  created_at: timestamp
  last_login: timestamp
  streak_count: integer
  streak_last_date: date
  preferences: json
}
```

### Notes
```
notes {
  id: uuid (PK)
  user_id: uuid (FK -> users.id)
  title: string
  content: text
  source_type: enum ['youtube', 'document', 'manual']
  source_url: string (nullable)
  tags: array[string]
  created_at: timestamp
  updated_at: timestamp
  is_favorite: boolean
}
```

### Flashcards
```
flashcards {
  id: uuid (PK)
  user_id: uuid (FK -> users.id)
  note_id: uuid (FK -> notes.id, nullable)
  question: text
  answer: text
  tags: array[string]
  created_at: timestamp
  updated_at: timestamp
  last_review: timestamp
  review_count: integer
  difficulty_rating: integer (1-5)
}
```

### Flashcard Sets
```
flashcard_sets {
  id: uuid (PK)
  user_id: uuid (FK -> users.id)
  title: string
  description: text (nullable)
  created_at: timestamp
  updated_at: timestamp
}
```

### Flashcard Set Items
```
flashcard_set_items {
  id: uuid (PK)
  set_id: uuid (FK -> flashcard_sets.id)
  flashcard_id: uuid (FK -> flashcards.id)
  position: integer
}
```

### Documents
```
documents {
  id: uuid (PK)
  user_id: uuid (FK -> users.id)
  filename: string
  file_type: string
  file_size: integer
  storage_path: string
  created_at: timestamp
  processed: boolean
}
```

### Chat Sessions
```
chat_sessions {
  id: uuid (PK)
  user_id: uuid (FK -> users.id)
  note_id: uuid (FK -> notes.id, nullable)
  title: string
  created_at: timestamp
  updated_at: timestamp
}
```

### Chat Messages
```
chat_messages {
  id: uuid (PK)
  session_id: uuid (FK -> chat_sessions.id)
  role: enum ['user', 'assistant']
  content: text
  timestamp: timestamp
}
```

## Folder Structure

```
edu-ai/
├── app/                      # Main application code
│   ├── assets/               # Static assets
│   │   ├── images/           # Image files
│   │   └── fonts/            # Font files
│   ├── components/           # Reusable UI components
│   │   ├── common/           # Shared components (buttons, inputs, etc.)
│   │   ├── layouts/          # Layout components (headers, footers, etc.)
│   │   ├── notes/            # Notes-specific components
│   │   ├── flashcards/       # Flashcards-specific components
│   │   └── chat/             # Chat UI components
│   ├── screens/              # Screen components
│   │   ├── auth/             # Authentication screens
│   │   ├── home/             # Home screen
│   │   ├── youtube/          # YouTube to Notes screen
│   │   ├── docs/             # Docs to Notes screen
│   │   ├── flashcards/       # Flashcards screens
│   │   ├── library/          # Library screen
│   │   └── profile/          # Profile screen
│   ├── navigation/           # Navigation configuration
│   ├── services/             # API and service integrations
│   │   ├── api/              # API client and endpoints
│   │   ├── ai/               # AI processing services
│   │   ├── auth/             # Authentication services
│   │   ├── storage/          # File storage services
│   │   └── analytics/        # Analytics services
│   ├── utils/                # Utility functions
│   ├── hooks/                # Custom React hooks
│   ├── contexts/             # React context providers
│   └── config/               # App configuration
├── api/                      # Backend API code
│   ├── controllers/          # API route handlers
│   ├── models/               # Database models
│   ├── services/             # Business logic services
│   ├── middleware/           # API middleware
│   ├── utils/                # Backend utilities
│   └── config/               # Backend configuration
├── database/                 # Database setup and migrations
│   ├── migrations/           # Database migration files
│   └── seeds/                # Seed data for development
├── docs/                     # Documentation
│   └── CONTEXT.md            # App context and overview
├── tests/                    # Test files
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   └── e2e/                  # End-to-end tests
├── .env.example              # Example environment variables
├── package.json              # Project dependencies
├── README.md                 # Project overview
└── docker-compose.yml        # Docker configuration
```
