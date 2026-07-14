# TASK COMPLETION CHECKLIST - MANDATORY BEFORE CLAIMING "DONE"

## BEFORE YOU FUCKING DO ANYTHING - UNDERSTAND THE TASK

### STEP 0: TASK ANALYSIS (MANDATORY FIRST STEP)

- [ ] IMPORATANT: NEVER MAKE assumptions, if you are ASK
- [ ] Read the user's request completely - EVERY WORD
- [ ] Identify EXACTLY what needs to be done
- [ ] Check if any existing files need to be modified
- [ ] Understand which directories/files are involved
- [ ] Identify if new files need to be created
- [ ] Check if routes need to be added/modified
- [ ] Understand the scope - is it just frontend, backend, or both?
- [ ] Read any related documentation (MEMBER_ASSIGNMENT_README.md, etc.)
- [ ] Check current state of files BEFORE making changes
- [ ] Plan the order of operations
- [ ] DO NOT DO ANYTHING OUT OF THE SCOPE
- [ ] UNLESS USER HAVE GIVE YOU A CONFIMATION YOU SHOULD NOT MODIFYING THE CODEBASE

### STEP 0.5: VERIFY CURRENT STATE

- [ ] Run current lint status: `npm run lint`
- [ ] Check if project currently compiles
- [ ] Verify existing routes work
- [ ] Check current navigation state
- [ ] Understand existing code structure

## BEFORE TELLING USER TASK IS COMPLETE - RUN ALL CHECKS

FOLLOWING THE FXXKING CODING PARTICES

### 1. CODE QUALITY CHECKS

- [ ] Run `npm run lint` in both fe-ts and be-ts - MUST BE ZERO ERRORS
- [ ] Run `npx prettier --check .` - MUST PASS
- [ ] Check for TypeScript compilation errors
- [ ] Verify all imports have correct paths
- [ ] Ensure all exports match imports

### 2. FUNCTIONALITY CHECKS

- [ ] All new routes added to App.tsx with proper imports
- [ ] All navigation links point to correct URLs
- [ ] All components export correctly (default vs named exports)
- [ ] All API calls use correct function names and paths
- [ ] All type definitions match actual data structures

### 3. FILE STRUCTURE CHECKS

- [ ] All new files created in correct directories
- [ ] no fxxking index.ts
- [ ] No missing dependencies or circular imports
- [ ] All file paths are relative and correct

### 4. CRITICAL BUSINESS LOGIC CHECKS

- [ ] Owner visibility in Member Tab maintained
- [ ] Current user available for ticket assignment
- [ ] ProjectDetailsProvider.tsx fetchProjectDetails() logic intact
- [ ] getOwner() function still works
- [ ] No duplicate users in dropdowns

### 5. INTEGRATION CHECKS

- [ ] New features integrate with existing navigation
- [ ] CSS classes exist in index.scss
- [ ] No conflicts with existing routes
- [ ] Authentication routes still protected
- [ ] Permission checks still work

### 6. TESTING SIMULATION

- [ ] Manually trace through user journey
- [ ] Verify all click paths work
- [ ] Check error handling exists
- [ ] Confirm loading states work
- [ ] Test with different user roles

### 7. CLEANUP CHECKS

- [ ] No console.log statements left behind
- [ ] No commented out code unless needed
- [ ] No unused imports or variables
- [ ] No temporary files created
- [ ] Git status clean (no untracked files)

## MANDATORY COMMANDS TO RUN BEFORE "DONE"

```bash
# Frontend checks
cd /Users/oceanshadow/Desktop/work/fe-ts
npm run lint                    # MUST return 0 errors
npx prettier --check .          # MUST pass
npm run build                   # MUST succeed

# Backend checks
cd /Users/oceanshadow/Desktop/work/be-ts
npm run lint                    # MUST return 0 errors
npm run build                   # MUST succeed (if build script exists)
```

## IF ANY CHECK FAILS

- DO NOT tell user task is complete
- Fix all issues first
- Re-run all checks
- Only claim completion after ALL checks pass

## RESPONSE TEMPLATE WHEN COMPLETE

```
✅ TASK COMPLETED - ALL CHECKS PASSED

✅ Code Quality: 0 ESLint errors, Prettier formatted
✅ Functionality: All routes work, navigation functional
✅ Integration: No conflicts, existing features intact
✅ Critical Logic: Member assignment logic preserved
✅ Testing: User journeys verified

READY FOR USE: [Specific instructions on how to access/use the feature]
```

---

**REMEMBER: User's time is valuable. UNDERSTAND FIRST, EXECUTE SECOND, VERIFY THIRD. Don't claim completion unless EVERYTHING works perfectly.**
