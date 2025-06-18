import { NextRequest, NextResponse } from 'next/server';
import { TitleGeneratorService } from '@/lib/services/title-generator';
import type { TitleGenerationRequest, TitleGenerationError } from '@/lib/types';

export const runtime = 'edge';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    // Get API key from headers
    const apiKey = request.headers.get('X-OpenRouter-API-Key');
    
    if (!apiKey) {
      const error: TitleGenerationError = {
        error: 'OpenRouter API key is required for title generation',
        code: 'MISSING_API_KEY',
        details: 'Please provide your OpenRouter API key in the X-OpenRouter-API-Key header',
      };
      
      return NextResponse.json(error, { status: 400 });
    }

    // Parse request body
    const body: TitleGenerationRequest = await request.json();
    
    // Validate required fields
    if (!body.prompt?.trim()) {
      const error: TitleGenerationError = {
        error: 'Prompt is required for title generation',
        code: 'MISSING_PROMPT',
      };
      
      return NextResponse.json(error, { status: 400 });
    }

    if (!body.chatId) {
      const error: TitleGenerationError = {
        error: 'Chat ID is required for title generation',
        code: 'MISSING_CHAT_ID',
      };
      
      return NextResponse.json(error, { status: 400 });
    }

    // Initialize title generator with API key
    const titleGenerator = new TitleGeneratorService(apiKey);

    // Generate the title
    const result = await titleGenerator.generateTitle(body);

    // Return the generated title (database update will be handled client-side)
    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    const errorResponse: TitleGenerationError = {
      error: error instanceof Error ? error.message : 'Failed to generate title',
      code: 'GENERATION_FAILED',
      details: error instanceof Error ? error.stack : undefined,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-OpenRouter-API-Key',
    },
  });
}
