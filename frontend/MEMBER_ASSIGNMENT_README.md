# MEMBER ASSIGNMENT CRITICAL LOGIC - DO NOT BREAK!

## REQUIREMENTS

1. **OWNER must be visible in Member Tab**
2. **OWNER must be available for ticket assignment**
3. **CURRENT USER must be available for ticket assignment**

## KEY FILES TO NEVER BREAK

### 1. `/src/context/ProjectDetailsProvider.tsx`

**CRITICAL SECTION:** `fetchProjectDetails()` function

```typescript
// CRITICAL: This logic ensures current user and owner are in users list
const users = res.data.users || [];
const owner = getOwner(projectId);
const finalUsersList = [...users];

// Add current user if not in list
const currentUserInList = users.find((user: IUserInfo) => user.id === currentUser.id);
if (!currentUserInList && currentUser.id) {
  finalUsersList.unshift(currentUser);
}

// Add owner if not in list
if (owner?.id && !finalUsersList.some((user: IUserInfo) => user.id === owner.id)) {
  finalUsersList.push(owner);
}

// MUST use finalUsersList, NOT res.data.users
setDetails({
  users: finalUsersList // <- CRITICAL
});
```

### 2. `/src/pages/ProjectMembersPage/ProjectMembersPage.tsx`

- Uses `getOwner(projectId)` to fetch owner
- Passes owner to ProjectMemberMain for display

### 3. `/src/utils/helpers.ts`

- Contains `getOwner()` function
- DO NOT modify without testing assignment

## TESTING CHECKLIST

- [ ] Owner visible in Member Tab
- [ ] Owner available in assignment dropdown
- [ ] Current user available in assignment dropdown
- [ ] Can assign tickets to both owner and current user
- [ ] No duplicate users in dropdown

## IF SOMETHING BREAKS

1. Check ProjectDetailsProvider.tsx fetchProjectDetails()
2. Verify current user context in UserInfoProvider.tsx
3. Test getOwner() function in helpers.ts
4. Rollback recent changes to these files

**REMEMBER: Both MEMBER TAB and ASSIGNMENT DROPDOWN must show owner!**
