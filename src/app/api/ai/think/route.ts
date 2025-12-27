import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, AI_MODELS, AI_CONFIG } from '@/lib/ai/config';
import { ThinkRequestSchema, ThinkResponse, THINK_RESPONSE_JSON_SCHEMA } from '@/lib/ai/types';
import { LUNA_SYSTEM_PROMPT, CONTEXT_PROMPTS } from '@/lib/ai/system-prompt';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/ai/rate-limiter';
import { loadContextForRequest } from '@/lib/ai/context-loader';
import { enrichWithResources, isYouTubeConfigured } from '@/lib/ai/resource-enricher';

/**
 * POST /api/ai/think
 * 
 * Luna's thinking partner endpoint.
 * Returns structured JSON with clarifying questions and/or suggestions.
 * 
 * Constraints (per AI philosophy docs):
 * - No database writes
 * - No persistent memory
 * - No kid-facing output
 * - Parent must explicitly invoke
 * - Only loads minimal context needed for request type
 */
export async function POST(request: NextRequest) {
  try {
    // Get user identifier for rate limiting
    // In production, use authenticated user ID
    const identifier = request.headers.get('x-forwarded-for') 
      ?? request.headers.get('x-real-ip') 
      ?? 'anonymous';
    
    // Check rate limit
    const rateLimitResult = checkRateLimit(identifier);
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many requests',
          retryAfter: rateLimitResult.retryAfter,
        },
        { 
          status: 429,
          headers: rateLimitHeaders,
        }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const parseResult = ThinkRequestSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400, headers: rateLimitHeaders }
      );
    }
    
    const { context, message, history, childProfileId, lessonId, weekStartDate } = parseResult.data;
    
    // =========================================
    // LOAD CONTEXT (minimal, scoped by mode)
    // =========================================
    const loadedContext = await loadContextForRequest({
      context,
      childProfileId,
      lessonId,
      weekStartDate,
    });
    
    // =========================================
    // BUILD PROMPTS (keep them short)
    // =========================================
    
    // System prompt with context-specific additions
    const contextPrompt = CONTEXT_PROMPTS[context] ?? CONTEXT_PROMPTS.GENERAL;
    const fullSystemPrompt = `${LUNA_SYSTEM_PROMPT}\n\n## Current Context: ${context}\n${contextPrompt}`;
    
    // User message with injected context (if any)
    let userMessage = message;
    if (loadedContext.formatted) {
      // Inject context at the start, clearly delimited
      userMessage = `${loadedContext.formatted}\n\n---\n\nParent's message:\n${message}`;
    }
    
    // Log what context was loaded (for debugging, not sent to model)
    console.log('[AI Think] Context loaded:', {
      mode: context,
      hasWeek: !!loadedContext.raw.week,
      hasLesson: !!loadedContext.raw.lesson,
      hasChild: !!loadedContext.raw.child,
      formattedLength: loadedContext.formatted.length,
      historyLength: history?.length || 0,
    });
    
    // =========================================
    // BUILD MESSAGES WITH HISTORY
    // =========================================
    type OpenAIMessage = { role: 'system' | 'user' | 'assistant'; content: string };
    const messages: OpenAIMessage[] = [
      { role: 'system', content: fullSystemPrompt },
    ];
    
    // Add conversation history (limit to last 10 messages to stay within context)
    if (history && history.length > 0) {
      const recentHistory = history.slice(-10);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }
    
    // Add current message
    messages.push({ role: 'user', content: userMessage });
    
    // =========================================
    // CALL OPENAI WITH STRUCTURED OUTPUTS
    // =========================================
    const openai = getOpenAIClient();
    
    const completion = await openai.chat.completions.create({
      model: AI_MODELS.default,
      temperature: AI_CONFIG.temperature,
      max_tokens: AI_CONFIG.maxTokens,
      messages,
      response_format: {
        type: 'json_schema',
        json_schema: THINK_RESPONSE_JSON_SCHEMA,
      },
    });
    
    // Parse the response
    const responseContent = completion.choices[0]?.message?.content;
    
    if (!responseContent) {
      console.error('Empty response from OpenAI');
      return NextResponse.json(
        { error: 'AI returned empty response' },
        { status: 502, headers: rateLimitHeaders }
      );
    }
    
    // Parse JSON response
    let parsedResponse: ThinkResponse;
    try {
      parsedResponse = JSON.parse(responseContent);
    } catch {
      console.error('Failed to parse OpenAI response:', responseContent);
      return NextResponse.json(
        { error: 'AI returned invalid response format' },
        { status: 502, headers: rateLimitHeaders }
      );
    }
    
    // Enrich with educational resources (videos, worksheets) if configured
    let enrichedResponse = parsedResponse;
    if (isYouTubeConfigured()) {
      try {
        enrichedResponse = await enrichWithResources(parsedResponse, {
          includeVideos: true,
          includeWorksheets: false, // Enable when Tavily is configured
          // TODO: Extract grade level from child profile context
        });
        console.log('[AI Think] Resources enriched:', {
          suggestionsWithVideos: enrichedResponse.suggestions.filter(
            (s) => 'videos' in s && Array.isArray(s.videos) && s.videos.length > 0
          ).length,
        });
      } catch (error) {
        console.error('[AI Think] Resource enrichment failed:', error);
        // Continue with unenriched response
      }
    }
    
    // Return structured response (enriched if YouTube is configured)
    return NextResponse.json(enrichedResponse, { headers: rateLimitHeaders });
    
  } catch (error) {
    console.error('AI think endpoint error:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'AI service not configured' },
          { status: 503 }
        );
      }
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return NextResponse.json(
          { error: 'AI service temporarily unavailable', retryAfter: 60 },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
