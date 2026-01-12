---
description: Critical checklist to prevent regressions in AI, Worksheets, and Lessons. Run this before finalizing ANY changes to these systems.
---

# Feature Integrity Checklist

> [!IMPORTANT]
> The following features are **highly interconnected** and **fragile**. You MUST verify these specific flows if your changes touch `lessons`, `worksheets`, `resources`, or `AI context`.

## 1. AI Context & Generation
- [ ] **Grade Level Context**: Verify that AI suggestions (videos, ideas) specifically respect the child's grade level.
    - *Test*: Ask for "math help" and ensure results are for the child's specific grade, not generic adult content.
- [ ] **Profile Context**: Ensure the AI "knows" who the child is (name, interests) when `childProfileId` is active.

## 2. Worksheet Lifecycle (The "Fragile Chain")
Regressions often break one link in this chain. Verify the WHOLE chain:
- [ ] **Generation**: Can you generate a worksheet from a Lesson modal?
- [ ] **Attachment**: Does the generated worksheet appear in the **Lesson's Resource list** immediately?
- [ ] **Persistence**: Is the worksheet saved to the `assignment_items` table? (Check DB or Assignments tab).
- [ ] **Viewing/Printing**: Click the worksheet link in the Lesson. Does it open the **Print View** (not a 404)?
- [ ] **No Duplication**: Close and reopen the Lesson modal. Are the links duplicated? (There should only be one link per resource).

## 3. Resource Management
- [ ] **Saving**: When adding a YouTube link or generic URL to a lesson, does it persist after refresh?
- [ ] **Edit vs. View**: Do resources appear correctly in both "Edit Mode" and "Read-Only View"?

## 4. "Save Idea" Flow
- [ ] **Chat Persistence**: In Luna Chat, clicking "Save Idea" must:
    - Save to `saved_ideas` table.
    - Show a success toast/state.
    - Appear in the "Ideas" tab immediately (or after refresh).

## 5. RLS & Permissions (If touching Supabase)
- [ ] **Kid Access**: Can a **Student** view these resources? (Check `kid_login` flows if applicable).
- [ ] **Parent Access**: Can the **Parent** edit/delete without RLS errors?

---

**If you break any of these, you have failed.**
**Do not assume 'it should work'. Verify it.**
