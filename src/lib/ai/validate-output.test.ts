import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateAiOutput,
  validateAndFallback,
  SAFE_FALLBACK_RESPONSE,
} from './validate-output';
import type { LunaThinkResponse } from './types';

// ============================================
// TEST FIXTURES
// ============================================

const validResponse: LunaThinkResponse = {
  clarifying_questions: [
    "What subjects does your child seem most drawn to right now?",
    "How much time do you typically have for this kind of exploration?",
  ],
  suggestions: [
    {
      title: "Nature journaling together",
      why_this_might_help: "Some families find that outdoor observation naturally sparks curiosity across subjects.",
      steps: [
        "Choose a nearby park or backyard spot",
        "Bring simple supplies: paper, pencils, magnifying glass",
        "Let your child lead what they want to observe",
      ],
    },
  ],
  tone_check: 'CALM',
};

const validGentleResponse: LunaThinkResponse = {
  clarifying_questions: [
    "It sounds like things feel overwhelming right now. Would you like to talk more about what's happening?",
  ],
  suggestions: [],
  tone_check: 'GENTLE',
};

// ============================================
// VALIDATION FUNCTION TESTS
// ============================================

describe('validateAiOutput', () => {
  describe('valid responses', () => {
    it('should pass validation for a well-formed CALM response', () => {
      const result = validateAiOutput(validResponse);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass validation for a well-formed GENTLE response', () => {
      const result = validateAiOutput(validGentleResponse);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass with empty arrays', () => {
      const response: LunaThinkResponse = {
        clarifying_questions: [],
        suggestions: [],
        tone_check: 'CALM',
      };
      
      const result = validateAiOutput(response);
      
      expect(result.valid).toBe(true);
    });

    it('should pass with maximum allowed counts (2 questions, 2 suggestions)', () => {
      const response: LunaThinkResponse = {
        clarifying_questions: ['Q1?', 'Q2?'],
        suggestions: [
          { title: 'S1', why_this_might_help: 'R1', steps: [] },
          { title: 'S2', why_this_might_help: 'R2', steps: [] },
        ],
        tone_check: 'CALM',
      };
      
      const result = validateAiOutput(response);
      
      expect(result.valid).toBe(true);
    });
  });

  describe('directive language detection', () => {
    const directivePhrases = [
      'You should try reading with them',
      'You need to establish a routine',
      'You must be consistent',
      'You have to set boundaries',
      "Make sure you review the material",
      "Make sure to check their work",
      "Don't forget to praise them",
      "It's important that you stay calm",
      'You ought to consider this approach',
    ];

    it.each(directivePhrases)(
      'should fail for directive phrase: "%s"',
      (phrase) => {
        const response: LunaThinkResponse = {
          clarifying_questions: [phrase],
          suggestions: [],
          tone_check: 'CALM',
        };
        
        const result = validateAiOutput(response);
        
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('Directive language'))).toBe(true);
      }
    );

    it('should detect directive language in suggestion titles', () => {
      const response: LunaThinkResponse = {
        clarifying_questions: [],
        suggestions: [
          {
            title: 'You should try morning lessons',
            why_this_might_help: 'Mornings can be calmer.',
            steps: [],
          },
        ],
        tone_check: 'CALM',
      };
      
      const result = validateAiOutput(response);
      
      expect(result.valid).toBe(false);
    });

    it('should detect directive language in why_this_might_help', () => {
      const response: LunaThinkResponse = {
        clarifying_questions: [],
        suggestions: [
          {
            title: 'Morning routine',
            why_this_might_help: 'You need to establish consistency for this to work.',
            steps: [],
          },
        ],
        tone_check: 'CALM',
      };
      
      const result = validateAiOutput(response);
      
      expect(result.valid).toBe(false);
    });

    it('should detect directive language in suggestion steps', () => {
      const response: LunaThinkResponse = {
        clarifying_questions: [],
        suggestions: [
          {
            title: 'Morning routine',
            why_this_might_help: 'Mornings are often calmer.',
            steps: ['First, you need to wake up early'],
          },
        ],
        tone_check: 'CALM',
      };
      
      const result = validateAiOutput(response);
      
      expect(result.valid).toBe(false);
    });
  });

  describe('diagnosis/testing language detection', () => {
    const diagnosisPhrases = [
      'This might indicate ADHD',
      'Consider testing for dyslexia',
      'They may have autism',
      'You should see a doctor about this',
      'Get them evaluated by a specialist',
      'Professional help might be needed',
      'They seem behind their peers',
      'This is not typical behavior',
      'They appear to have a learning disability',
      'Professional assessment could help',
      'Showing signs of attention issues',
    ];

    it.each(diagnosisPhrases)(
      'should fail for diagnosis phrase: "%s"',
      (phrase) => {
        const response: LunaThinkResponse = {
          clarifying_questions: [],
          suggestions: [
            {
              title: 'Concern',
              why_this_might_help: phrase,
              steps: [],
            },
          ],
          tone_check: 'CALM',
        };
        
        const result = validateAiOutput(response);
        
        expect(result.valid).toBe(false);
        expect(
          result.errors.some(e => e.includes('Diagnosis/testing language'))
        ).toBe(true);
      }
    );
  });

  describe('count limits', () => {
    it('should fail with 3 clarifying questions', () => {
      const response: LunaThinkResponse = {
        clarifying_questions: ['Q1?', 'Q2?', 'Q3?'],
        suggestions: [],
        tone_check: 'CALM',
      };
      
      const result = validateAiOutput(response);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Too many clarifying questions: 3 (max 2)');
    });

    it('should fail with 3 suggestions', () => {
      const response: LunaThinkResponse = {
        clarifying_questions: [],
        suggestions: [
          { title: 'S1', why_this_might_help: 'R1', steps: [] },
          { title: 'S2', why_this_might_help: 'R2', steps: [] },
          { title: 'S3', why_this_might_help: 'R3', steps: [] },
        ],
        tone_check: 'CALM',
      };
      
      const result = validateAiOutput(response);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Too many suggestions: 3 (max 2)');
    });
  });

  describe('tone_check validation', () => {
    it('should fail with invalid tone_check', () => {
      const response = {
        clarifying_questions: [],
        suggestions: [],
        tone_check: 'AGGRESSIVE',
      } as unknown as LunaThinkResponse;
      
      const result = validateAiOutput(response);
      
      expect(result.valid).toBe(false);
      expect(
        result.errors.some(e => e.includes('Invalid tone_check'))
      ).toBe(true);
    });
  });

  describe('multiple errors', () => {
    it('should report all validation errors', () => {
      const response = {
        clarifying_questions: [
          'Q1?',
          'Q2?',
          'Q3?', // Too many (max 2)
        ],
        suggestions: [
          {
            title: 'You should do this', // Directive
            why_this_might_help: 'Testing for issues helps', // Diagnosis
            steps: [],
          },
          { title: 'S2', why_this_might_help: 'R2', steps: [] },
          { title: 'S3', why_this_might_help: 'R3', steps: [] }, // Too many
        ],
        tone_check: 'URGENT', // Invalid
      } as unknown as LunaThinkResponse;
      
      const result = validateAiOutput(response);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
    });
  });
});

// ============================================
// FALLBACK FUNCTION TESTS
// ============================================

describe('validateAndFallback', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should return original response when valid', () => {
    const result = validateAndFallback(validResponse);
    
    expect(result).toBe(validResponse);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should return fallback response when invalid', () => {
    const invalidResponse: LunaThinkResponse = {
      clarifying_questions: ['You should think about this'],
      suggestions: [],
      tone_check: 'CALM',
    };
    
    const result = validateAndFallback(invalidResponse);
    
    expect(result).toBe(SAFE_FALLBACK_RESPONSE);
  });

  it('should log error when validation fails', () => {
    const invalidResponse: LunaThinkResponse = {
      clarifying_questions: ['You need to consider this'],
      suggestions: [],
      tone_check: 'CALM',
    };
    
    validateAndFallback(invalidResponse);
    
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[Luna Voice Validation Failed]',
      expect.objectContaining({
        errors: expect.any(Array),
        response: expect.any(String),
      })
    );
  });

  it('should return a non-directive, gentle fallback', () => {
    expect(SAFE_FALLBACK_RESPONSE.tone_check).toBe('GENTLE');
    expect(SAFE_FALLBACK_RESPONSE.suggestions).toHaveLength(0);
    expect(SAFE_FALLBACK_RESPONSE.clarifying_questions).toHaveLength(1);
    
    // Ensure fallback itself passes validation
    const result = validateAiOutput(SAFE_FALLBACK_RESPONSE);
    expect(result.valid).toBe(true);
  });
});
