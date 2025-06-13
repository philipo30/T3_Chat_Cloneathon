# Supabase Database Setup Guide

This guide will help you set up the Supabase database for the T3 Chat Cloneathon project.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. A Supabase project created
3. Your Supabase project URL and anon key

## Database Setup

### Step 1: Run the SQL Schema

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor (in the left sidebar)
3. Copy and paste the contents of `supabase-schema.sql` into the SQL editor
4. Click "Run" to execute the schema

This will create:
- `chats` table for storing chat sessions
- `messages` table for storing individual messages
- Proper indexes for performance
- Row Level Security (RLS) policies for data protection
- Triggers for automatic timestamp updates

### Step 2: Verify Tables

After running the schema, verify that the tables were created:

1. Go to the "Table Editor" in your Supabase dashboard
2. You should see two tables:
   - `chats`
   - `messages`

### Step 3: Environment Variables

Make sure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Schema Overview

### Chats Table
- `id` (UUID, Primary Key): Unique identifier for each chat
- `user_id` (UUID, Foreign Key): References the authenticated user
- `title` (TEXT): Chat title/name
- `model_id` (TEXT): AI model used for this chat
- `created_at` (TIMESTAMP): When the chat was created
- `updated_at` (TIMESTAMP): When the chat was last updated

### Messages Table
- `id` (UUID, Primary Key): Unique identifier for each message
- `chat_id` (UUID, Foreign Key): References the parent chat
- `role` (TEXT): Message role ('user', 'assistant', 'system')
- `content` (TEXT): Message content
- `created_at` (TIMESTAMP): When the message was created
- `is_complete` (BOOLEAN): Whether the message is fully generated
- `generation_id` (TEXT): OpenRouter generation ID for streaming

## Security Features

### Row Level Security (RLS)
- Users can only access their own chats and messages
- All database operations are automatically filtered by user ID
- No risk of data leakage between users

### Automatic Triggers
- Chat `updated_at` timestamp is automatically updated when messages are added/modified
- Ensures proper ordering and synchronization

## Testing the Setup

1. Start your development server: `npm run dev`
2. Navigate to the application
3. Log in with your Supabase authentication
4. Create a new chat - it should appear in the sidebar
5. Send a message - it should be stored in the database
6. Refresh the page - your chat history should persist

## Troubleshooting

### Common Issues

1. **Tables not created**: Make sure you ran the entire SQL schema without errors
2. **Permission denied**: Verify that RLS policies are properly set up
3. **Environment variables**: Double-check your Supabase URL and anon key
4. **Authentication**: Ensure users are properly authenticated before accessing chats

### Checking RLS Policies

In the Supabase dashboard:
1. Go to Authentication > Policies
2. Verify that policies exist for both `chats` and `messages` tables
3. Each table should have policies for SELECT, INSERT, UPDATE, and DELETE operations

## Performance Considerations

The schema includes several optimizations:
- Indexes on frequently queried columns
- Efficient foreign key relationships
- Automatic timestamp management
- Optimized RLS policies

For production use, consider:
- Setting up database backups
- Monitoring query performance
- Implementing rate limiting
- Adding additional indexes based on usage patterns
