---
description: Critical checklist to ensure AI features always receive kid context (grade level, age, interests)
---

# AI Kid Context Integrity Checklist

**CRITICAL:** All AI-powered features MUST receive kid context to provide age-appropriate, personalized content. This workflow prevents regressions where AI features start suggesting adult content or inappropriate grade levels.

## Why This Matters

Without kid context (grade level, age, interests):
- YouTube searches return adult TED talks, teacher resources instead of kid-friendly videos
- Worksheets are generated for wrong age/complexity
- Lesson plans miss the mark on appropriate difficulty
- Luna AI gives generic advice instead of personalized guidance

## AI Features That REQUIRE Kid Context

### ✅ 1. **Lesson Creation** (`/api/lessons`)
**Location:** `src/app/api/lessons/route.ts`

**Requirements:**
- MUST accept `assignTo` array with kid IDs
- MUST fetch kid `grades` array from database
- MUST pass first kid's first grade to `enrichActivity()` as `ageOrGrade` parameter
- Affects: YouTube video search, worksheet generation

**Code Pattern:**
```typescript
// Fetch kid grade levels if we have assigned students
let targetGradeLevel: string | undefined;
if (assignTo && assignTo.length > 0) {
  const { data: kids } = await supabase
    .from('kids')
    .select('grades')
    .in('id', assignTo);
  
  if (kids && kids.length > 0) {
    const firstKidGrades = kids[0].grades;
    if (firstKidGrades && firstKidGrades.length > 0) {
      targetGradeLevel = firstKidGrades[0];
    }
  }
}

// Pass to enrichment
const enrichment = await enrichActivity(
  { title, category, description },
  { searchYouTube: true, ageOrGrade: targetGradeLevel }
);
```

**Test:**
- Create lesson assigned to a 3rd grader
- Check console logs for: `[API/lessons] Target grade level: 3`
- Verify YouTube search includes: `for kids 3rd grade`
- Inspect returned videos - should be kid-appropriate

---

### ✅ 2. **Lesson Refinement** (`/api/refine-lesson`)
**Location:** `src/app/api/refine-lesson/route.ts`

**Requirements:**
- MUST accept `assignTo` array in request body
- MUST fetch kid grades same as lesson creation
- MUST pass to `enrichActivity()` for YouTube searches
- Affects: Video recommendations when refining lessons

**Code Pattern:**
```typescript
interface RefineRequest {
  lessonData: LessonData;
  feedback: string;
  assignTo?: string[];  // REQUIRED
}

// Fetch grades (same pattern as lessons)
// Pass to enrichActivity with ageOrGrade
```

**Test:**
- Edit existing lesson, add refinement like "add a video about fractions"
- Verify grade level is logged and used in search

---

### ✅ 3. **Activity Generation** (`/api/generate-activity`)
**Location:** `src/app/api/generate-activity/route.ts`

**Requirements:**
- MUST accept `gradeLevel` string from request
- MUST pass to AI prompt for content generation
- MUST pass to `enrichActivity()` for YouTube searches
- Affects: Lesson/assignment content complexity, video recommendations

**Code Pattern:**
```typescript
interface GenerateRequest {
  gradeLevel?: string;  // Should be REQUIRED
}

// Include in AI prompt
const context = `
  Grade Level: ${gradeLevel}
`

// Pass to enrichment
await enrichActivity(activity, { ageOrGrade: gradeLevel })
```

**Test:**
- Generate activity with grade level "5"
- Check AI response has appropriate complexity
- Verify videos are for 5th grade

---

### ✅ 4. **Luna AI Think Endpoint** (`/api/ai/think`)
**Location:** `src/app/api/ai/think/route.ts`

**Requirements:**
- MUST accept `childProfileId` in request
- MUST load kid context via `loadContextForRequest()`
- MUST extract grades from loaded context
- MUST pass to `enrichWithResources()` for video searches
- Affects: Video recommendations in suggestions

**Code Pattern:**
```typescript
// Extract grade level from context
if (childProfileId && loadedContext.raw.family?.kids) {
  const kid = loadedContext.raw.family.kids.find(k => k.id === childProfileId);
  if (kid?.grades?.length > 0) {
    gradeLevel = kid.grades.join(' ');
  }
}

await enrichWithResources(parsedResponse, { gradeLevel });
```

**Test:**
- Use Luna with a specific kid selected
- Verify console shows: `[AI Think] Enriching with grade level: 3`
- Check video suggestions are age-appropriate

---

### ⚠️ 5. **Worksheet Generation** (`/lib/ai/worksheet-generator.ts`)
**Location:** `src/lib/ai/worksheet-generator.ts`

**Requirements:**
- MUST accept `ageOrGrade` parameter
- MUST include in AI prompt for complexity adjustment
- Affects: Question difficulty, problem complexity

**Code Pattern:**
```typescript
export async function generateWorksheet(
  topic: string,
  ageOrGrade?: string | number,  // REQUIRED
  instructions?: string
)

// Include in prompt
const ageContext = ageOrGrade 
  ? `Target age/grade: ${ageOrGrade}` 
  : '';
```

**Test:**
- Generate worksheet for 1st grade math
- Verify problems are simple (1+1, not algebra)

---

## Common Mistakes to Avoid

### ❌ DON'T: Skip passing assignTo array
```typescript
// BAD - No kid context
fetch('/api/lessons', {
  body: JSON.stringify({ title, description })
})
```

### ✅ DO: Always include assignTo
```typescript
// GOOD - Includes kid context
fetch('/api/lessons', {
  body: JSON.stringify({ 
    title, 
    description,
    assignTo: selectedKidIds  // Required!
  })
})
```

### ❌ DON'T: Forget to pass ageOrGrade to enrichActivity
```typescript
// BAD - Grade level fetched but not used
const enrichment = await enrichActivity(
  { title, category },
  { searchYouTube: true }  // Missing ageOrGrade!
);
```

### ✅ DO: Pass the grade level
```typescript
// GOOD - Grade level used
const enrichment = await enrichActivity(
  { title, category },
  { searchYouTube: true, ageOrGrade: targetGradeLevel }
);
```

---

## Testing Requirements

Before deploying any AI feature changes:

1. **Create test lesson** assigned to kid with known grade (e.g., "3")
2. **Check server logs** for grade level being passed:
   ```
   [API/lessons] Target grade level: 3
   [Enrichment] Searching YouTube for: ... | Grade: 3
   [YouTube] Searching: ... for kids 3rd grade educational lesson
   ```
3. **Inspect YouTube results** - all videos should be kid-appropriate
4. **Test Luna AI** - select a kid, check grade context is loaded
5. **Test worksheets** - verify difficulty matches grade level

---

## Database Schema Reference

**Kids table `grades` column:**
- Type: `text[]` (array of strings)
- Example: `["3", "4"]` (kid working at 3rd & 4th grade level)
- Fallback: `grade_band` (legacy, e.g., "3-5")

**Query pattern:**
```sql
SELECT grades FROM kids WHERE id = $1
```

**Grade level format in YouTube search:**
- "K" → "for kids kindergarten"
- "1" → "for kids 1st grade"
- "3" → "for kids 3rd grade"
- "6" → "middle school 6th grade"
- "9" → "high school 9th grade"

See: `src/lib/resources/types.ts` `getGradeLevelSearchTerms()`

---

## Files to Review When Modifying AI Features

**Critical Files:**
1. `/app/api/lessons/route.ts` - Lesson creation
2. `/app/api/refine-lesson/route.ts` - Lesson refinement
3. `/app/api/generate-activity/route.ts` - Activity generation
4. `/app/api/ai/think/route.ts` - Luna AI
5. `/lib/ai/enrich-activity.ts` - Centralized enrichment
6. `/lib/ai/worksheet-generator.ts` - Worksheet generation
7. `/lib/resources/youtube.ts` - YouTube search

**Before committing AI changes, verify:**
- [ ] Grade level is fetched from database when kids are assigned
- [ ] Grade level is logged to console (for debugging)
- [ ] Grade level is passed to all AI functions
- [ ] YouTube search query includes grade-appropriate terms
- [ ] Test with actual kid data shows appropriate results

---

## Related Workflows

- `/feature-integrity-checklist` - Broader feature testing
- `/supabase-migrations` - Database schema changes

---

## Emergency Fix Checklist

If age-inappropriate content appears:

1. Check console logs - is grade level being logged?
2. If NO grade in logs → Not fetching from database (API route issue)
3. If grade in logs but not used → Not passing to enrichment functions
4. If grade passed but ignored → YouTube search not incorporating it
5. Quick fix: Hardcode grade level temporarily while investigating root cause

**Report Pattern:**
- Title: "AI returning adult content for [feature]"
- Include: Console logs, kid grade, search query, video results
- Tag: `ai-context`, `bug-critical`
