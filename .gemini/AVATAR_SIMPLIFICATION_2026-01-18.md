# Avatar System Simplification - Summary

## Date: 2026-01-18

## Overview
Simplified the kid avatar system to focus exclusively on the avatar builder, removing the photo upload functionality.

## Changes Made

### 1. **Removed Photo Upload from Profile Page**
   - **File**: `/src/app/kids/[kidId]/profile/page.tsx`
   - Removed the `AvatarUploadWrapper` component import and usage
   - Removed the grid layout that showed both photo upload and avatar builder side-by-side
   - Now displays a single, centered card linking to the avatar builder
   - Header avatar display now only shows the built avatar (no photo fallback)

### 2. **Added First-Time Avatar Setup**
   - **New File**: `/src/components/kids/AvatarSetupRedirect.tsx`
   - Client component that automatically redirects kids to the avatar builder on their first login
   - Checks if kid has an `avatarState` and if this is their first login (based on `lastLoginAt`)
   - Integrated into `/src/app/kids/[kidId]/page.tsx` (kid portal home page)

### 3. **Added Monthly Avatar Reminder**
   - **New File**: `/src/components/kids/AvatarReminderBanner.tsx`
   - Displays a dismissible banner reminding kids to set up their avatar
   - Only shows if avatar is not configured
   - Uses localStorage to track when last shown - displays once per month
   - Integrated into `/src/app/kids/[kidId]/page.tsx` (only shows on "today" view)

### 4. **Updated Kid Portal Page**
   - **File**: `/src/app/kids/[kidId]/page.tsx`
   - Added `AvatarSetupRedirect` component to handle first-login redirects
   - Added `AvatarReminderBanner` component for monthly reminders
   - Both components are seamlessly integrated into the existing page structure

## Technical Details

### Flow
1. **First Login**: Kid logs in → `AvatarSetupRedirect` checks if avatar is set → If not, redirects to `/kids/[kidId]/avatar`
2. **Subsequent Logins**: Kid sees normal portal page
3. **Monthly Reminder**: If avatar still not set after 30 days, banner appears (dismissible)

### Data Model
- `Kid.avatarState`: Contains the avatar configuration (base, outfit, accessory, colors)
- `Kid.avatarUrl`: Still exists in database but is no longer displayed or editable (kept for backward compatibility)
- `Kid.lastLoginAt`: Used to determine if this is the first login

## Files Kept (Unused but Available)
The following files are no longer actively used but remain in the codebase:
- `/src/components/kids/AvatarUpload.tsx` - Photo upload component
- `/src/components/kids/AvatarUploadWrapper.tsx` - Wrapper for upload component
- `/src/app/api/kids/[kidId]/avatar/route.ts` - Photo upload API endpoint

These can be removed in a future cleanup if photo upload functionality is permanently deprecated.

## Testing Checklist
- [ ] First-time kid login redirects to avatar builder
- [ ] Avatar builder works correctly and saves avatar state
- [ ] Kid profile page shows built avatar (no photo option)
- [ ] Monthly reminder appears if avatar not set
- [ ] Reminder can be dismissed and doesn't reappear immediately
- [ ] Kid navigation links to avatar builder work correctly
- [ ] Existing kids with avatars see their avatar normally

## Migration Notes
- No database migration required
- Existing `avatar_url` data is preserved but not displayed
- Existing `avatar_state` data continues to work as before
