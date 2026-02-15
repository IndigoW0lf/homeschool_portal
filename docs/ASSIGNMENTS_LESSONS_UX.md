# Assignments & Lessons Creation – UX Notes and Improvements

## What Was Fixed (this pass)

1. **AI enrichment when description is empty**
   - Worksheet generation now uses the activity **title** as context when description is empty, so "Generate worksheet" works without a description.
   - The activities API passes `worksheetInstructions: input.description || input.title` so the AI always has context.
   - In `enrich-activity.ts`, `generateWorksheetContent` falls back to `Topic: ${activity.title}` when both description and instructions are empty.

2. **Enrichment failures no longer block saving**
   - The activities API wraps `enrichActivity()` in try/catch. If YouTube or worksheet enrichment throws, the activity is still created with no videos/worksheet instead of returning 500 and showing "Could not save activity."

3. **Clearer copy for AI options**
   - Under "Additional Enrichment (optional)" we added:  
     *"A title is required for AI. Adding a description improves video and worksheet results but is not required."*

## Recommended Follow-ups (section-by-section later)

- **Single flow vs. separate Lesson/Assignment forms**  
  Right now Create Activity is one form with tabs (Lesson / Assignment / Worksheet). Consider whether a clearer split (e.g. "Add Lesson" vs "Add Assignment") would be easier for parents.

- **Required vs optional fields**  
  Make required fields obvious (e.g. asterisk + "Required" in the label). Keep description optional but recommend it for AI.

- **Validation feedback**  
  If the API returns a structured error (e.g. missing title), show it next to the relevant field instead of only in a toast.

- **Schedule + Assign To**  
  Make it obvious that picking a date and "Assign To" is what actually schedules the item; otherwise it’s only saved to the library.

- **Success state**  
  After save, consider a short confirmation that shows what was created (lesson vs assignment, scheduled date, kids) and a link to the week view or the new item.

- **Loading states**  
  During "Generate" (from title) and during submit (when enrichment runs), keep loading states clear so parents know the AI is working.

- **Error messages**  
  When enrichment fails, you could add a non-blocking note in the success toast, e.g. "Activity saved; worksheet generation didn’t complete (optional)."

These can be tackled when we do the full assignment/lesson UI pass.
