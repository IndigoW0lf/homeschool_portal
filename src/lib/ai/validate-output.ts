import type { LunaThinkResponse } from './types';

// ============================================
// VOICE ENFORCEMENT VALIDATION
// ============================================

/**
 * Validation result from validateAiOutput
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Forbidden directive phrases that violate Luna's voice
 * These are commands/directives that make Luna feel parental rather than companion-like
 */
const DIRECTIVE_PATTERNS = [
  /\byou should\b/i,
  /\byou need to\b/i,
  /\byou must\b/i,
  /\byou have to\b/i,
  /\bmake sure (you|to)\b/i,
  /\bdon't forget to\b/i,
  /\bit's important that you\b/i,
  /\byou ought to\b/i,
];

/**
 * Forbidden diagnosis/testing language that violates product philosophy
 * Luna never diagnoses, labels, or suggests clinical evaluation
 */
const DIAGNOSIS_PATTERNS = [
  /\b(adhd|add|autism|asd|dyslexia|dyscalculia|learning disability|disorder)\b/i,
  /\btest(ing|ed)?\s+(for|them|your child)\b/i,
  /\bdiagnos(e|is|ed|tic)\b/i,
  /\bsee a (doctor|specialist|therapist|professional)\b/i,
  /\bget (them|your child) evaluated\b/i,
  /\bprofessional (help|assessment|evaluation)\b/i,
  /\bgrade level\b/i,
  /\bbehind (their|other) peers\b/i,
  /\bnot (normal|typical)\b/i,
  /\bshowing signs of\b/i,
];

/**
 * Safe fallback response when validation fails
 * This is gentle, non-directive, and asks for clarification
 */
export const SAFE_FALLBACK_RESPONSE: LunaThinkResponse = {
  clarifying_questions: [
    "I'd love to understand your situation better. Could you tell me more about what's on your mind?",
  ],
  suggestions: [],
  tone_check: 'GENTLE',
};

/**
 * Check text content for forbidden patterns
 */
function containsForbiddenPattern(
  text: string,
  patterns: RegExp[]
): string | null {
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      return pattern.source;
    }
  }
  return null;
}

/**
 * Extract all text content from a Luna response for validation
 */
function extractAllText(response: LunaThinkResponse): string {
  const parts: string[] = [];
  
  // Add clarifying questions
  parts.push(...response.clarifying_questions);
  
  // Add suggestion content
  for (const suggestion of response.suggestions) {
    parts.push(suggestion.title);
    parts.push(suggestion.why_this_might_help);
    parts.push(...suggestion.steps);
  }
  
  return parts.join(' ');
}

/**
 * Validates AI output to ensure it conforms to Luna's voice philosophy.
 * 
 * This function enforces:
 * 1. No directive language ("should", "need to", "must")
 * 2. No diagnosis or testing language
 * 3. Max 3 clarifying questions
 * 4. Max 2 suggestions
 * 5. tone_check must be CALM or GENTLE
 * 
 * @param response - The AI response to validate
 * @returns ValidationResult with valid flag and any errors
 */
export function validateAiOutput(response: LunaThinkResponse): ValidationResult {
  const errors: string[] = [];
  const allText = extractAllText(response);

  // Check 1: No directive language
  const directiveMatch = containsForbiddenPattern(allText, DIRECTIVE_PATTERNS);
  if (directiveMatch) {
    errors.push(`Directive language detected: "${directiveMatch}"`);
  }

  // Check 2: No diagnosis/testing language
  const diagnosisMatch = containsForbiddenPattern(allText, DIAGNOSIS_PATTERNS);
  if (diagnosisMatch) {
    errors.push(`Diagnosis/testing language detected: "${diagnosisMatch}"`);
  }

  // Check 3: Max 2 clarifying questions
  if (response.clarifying_questions.length > 2) {
    errors.push(
      `Too many clarifying questions: ${response.clarifying_questions.length} (max 2)`
    );
  }

  // Check 4: Max 2 suggestions
  if (response.suggestions.length > 2) {
    errors.push(
      `Too many suggestions: ${response.suggestions.length} (max 2)`
    );
  }

  // Check 5: Valid tone_check
  if (response.tone_check !== 'CALM' && response.tone_check !== 'GENTLE') {
    errors.push(
      `Invalid tone_check: "${response.tone_check}" (must be CALM or GENTLE)`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates AI output and returns either the validated response or a safe fallback.
 * Logs validation failures for monitoring.
 * 
 * @param response - The AI response to validate
 * @returns The original response if valid, or SAFE_FALLBACK_RESPONSE if invalid
 */
export function validateAndFallback(
  response: LunaThinkResponse
): LunaThinkResponse {
  const result = validateAiOutput(response);

  if (!result.valid) {
    console.error('[Luna Voice Validation Failed]', {
      errors: result.errors,
      response: JSON.stringify(response, null, 2),
    });
    return SAFE_FALLBACK_RESPONSE;
  }

  return response;
}
