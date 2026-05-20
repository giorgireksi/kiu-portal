# Admin Scheduler Logout Fix - Bugfix Design

## Overview

This bugfix addresses a critical authentication failure that occurs when admin users attempt to navigate to the admin scheduler page. The bug manifests as an unexpected logout and redirect to the login page, preventing admins from accessing the scheduler interface.

The root cause is unreachable code in the `navigate()` function (`assets/js/features/navigation.js`, lines ~350-360). The function calls `window.location.assign(hardRouteUrl)` followed by an immediate `return` statement. This creates a full page reload that interrupts the execution flow before any SPA-style navigation logic can execute. During the reload, the authentication state restoration fails, triggering the `requireAuth()` function to redirect unauthenticated users to login.html.

The fix strategy is to remove the unreachable code block and allow the existing SPA navigation logic to handle admin-scheduler navigation properly. The function already has robust logic for handling both SPA sections and standalone HTML pages - we just need to let it execute.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when an admin user navigates to admin-scheduler and the unreachable code block executes
- **Property (P)**: The desired behavior - admin-scheduler navigation should preserve authentication and load the page successfully
- **Preservation**: All other navigation paths (admin-tools, admin-library, admin-orders, staff, students-admin, profile-view, SPA sections) must continue working exactly as before
- **navigate()**: The function in `assets/js/features/navigation.js` that handles all page navigation in the portal
- **hardRouteUrl**: The resolved URL for a page (e.g., "admin-scheduler.html") returned by `resolvePortalRouteUrl()`
- **SPA navigation**: Single-page application style navigation that switches visible sections without full page reloads
- **Full page reload**: Navigation via `window.location.assign()` that causes the browser to reload the entire page
- **requireAuth()**: Function in `assets/js/app/auth.js` that checks authentication state and redirects to login if not authenticated
- **loadAuthState()**: Function in `assets/js/app/auth.js` that restores user authentication state from localStorage

## Bug Details

### Bug Condition

The bug manifests when an admin user clicks the admin-scheduler navigation button. The `navigate()` function resolves the URL to "admin-scheduler.html", calls `window.location.assign()` with this URL, and immediately returns. This prevents the subsequent navigation logic from executing, causing a full page reload that fails to preserve authentication state.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type NavigationRequest
  OUTPUT: boolean
  
  RETURN input.pageId == 'admin-scheduler'
         AND input.userRole == 'admin'
         AND unreachableCodeBlockExists(navigate, lines 350-360)
         AND authenticationStateNotPreserved()
END FUNCTION
```

### Examples

- **Example 1**: Admin user clicks "Master Scheduler" button in admin navigation → Expected: scheduler page loads with user logged in → Actual: user is logged out and redirected to login.html
- **Example 2**: Admin user navigates to admin-scheduler via direct URL → Expected: scheduler page loads with user logged in → Actual: user is logged out and redirected to login.html
- **Example 3**: Admin user clicks "Admin Tools" button → Expected: admin-tools page loads with user logged in → Actual: admin-tools page loads successfully (no bug)
- **Edge case**: Admin user navigates to admin-scheduler while already on admin-scheduler.html → Expected: page remains loaded with user logged in → Actual: user is logged out and redirected to login.html

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Navigation to other admin pages (admin-tools, admin-library, admin-orders, staff, students-admin, profile-view) must continue to work exactly as before
- SPA-style navigation for pages with sections (home, social, news, exams) must continue to work without full page reloads
- Authentication state restoration via `loadAuthState()` and `requireAuth()` must continue to work for all pages
- Non-admin users navigating to their allowed pages must continue to work without issues
- Unauthenticated users attempting to access protected pages must continue to be redirected to login.html

**Scope:**
All navigation requests that do NOT involve the admin-scheduler page should be completely unaffected by this fix. This includes:
- All other admin pages (admin-tools, admin-library, admin-orders, staff, students-admin, profile-view)
- All SPA sections (home, social, news, exams, chancellery, student-service, email)
- All role-specific pages (student, professor, TA, student service)
- Authentication flows (login, logout, session restoration)

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is:

1. **Unreachable Code Block**: Lines ~350-360 in `navigate()` contain a code block that calls `window.location.assign(hardRouteUrl)` followed immediately by `return`. This creates unreachable code - any logic after this block never executes.

2. **Premature Full Page Reload**: The `window.location.assign()` call triggers a full page reload before the function can evaluate whether admin-scheduler has an SPA section or should use the existing navigation logic.

3. **Authentication State Loss**: During the full page reload, the authentication state restoration process fails. The `requireAuth()` function on admin-scheduler.html detects no authenticated user and redirects to login.html.

4. **Inconsistent Navigation Pattern**: Other admin pages (admin-tools, admin-library, admin-orders) are handled by the "always-external" logic or the final redirect block, which work correctly. Admin-scheduler falls into the unreachable code block instead.

## Correctness Properties

Property 1: Bug Condition - Admin Scheduler Navigation Preserves Authentication

_For any_ navigation request where the pageId is 'admin-scheduler' and the user is authenticated as an admin, the fixed navigate function SHALL successfully load the admin-scheduler.html page while preserving the user's authentication state, preventing any redirect to login.html.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Other Navigation Paths Unchanged

_For any_ navigation request where the pageId is NOT 'admin-scheduler' (including admin-tools, admin-library, admin-orders, staff, students-admin, profile-view, and all SPA sections), the fixed navigate function SHALL produce exactly the same navigation behavior as the original function, preserving all existing navigation patterns and authentication handling.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `assets/js/features/navigation.js`

**Function**: `navigate(pageId, skipRuntimeBootstrap = false)`

**Specific Changes**:

1. **Remove Unreachable Code Block**: Delete or comment out lines ~350-360 that contain:
   ```javascript
   const hardRouteUrl = resolvePortalRouteUrl(pageId, effectiveRole);
   window.location.assign(hardRouteUrl);
   return;
   ```
   This block prevents the subsequent navigation logic from executing and causes the premature full page reload.

2. **Verify Always-External List**: Ensure that the `alwaysExternal` array (line ~365) includes all admin pages that should use full page reloads:
   ```javascript
   const alwaysExternal = ['admin-tools', 'admin-scheduler', 'staff', 'students-admin', 'profile-view'];
   ```
   This ensures admin-scheduler is handled by the correct navigation path.

3. **Verify External Pages Map**: Ensure that the `externalPages` object (line ~370) includes the admin-scheduler mapping:
   ```javascript
   const externalPages = {
       'admin-tools': 'admin-tools.html',
       'admin-scheduler': 'admin-scheduler.html',
       'staff': 'staff.html',
       'students-admin': 'students-admin.html',
       'profile-view': 'profile-view.html'
   };
   ```

4. **No Changes to Auth Functions**: The `requireAuth()` and `loadAuthState()` functions in `assets/js/app/auth.js` should NOT be modified. They are working correctly - the issue is that they never get a chance to execute due to the premature return in navigate().

5. **No Changes to Other Navigation Paths**: The SPA navigation logic, role-specific page handling, and final redirect block should remain unchanged to preserve existing behavior.

### Why This Fix Works

The existing `navigate()` function already has robust logic for handling both SPA sections and standalone HTML pages. By removing the unreachable code block, we allow the function to:

1. Check if the page is in the `alwaysExternal` list
2. If yes, use `window.location.assign()` to navigate to the standalone HTML file
3. The standalone HTML file (admin-scheduler.html) loads its own scripts, including auth.js
4. The `requireAuth()` function executes and successfully restores auth state from localStorage
5. The user remains logged in and sees the scheduler interface

The key insight is that the bug is not in the authentication logic - it's in the navigation logic preventing the authentication logic from running properly.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate admin navigation to admin-scheduler and verify that authentication state is preserved. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Admin Scheduler Navigation Test**: Admin user clicks admin-scheduler nav button → verify user remains logged in and scheduler page loads (will fail on unfixed code)
2. **Direct URL Navigation Test**: Admin user navigates directly to admin-scheduler.html URL → verify user remains logged in (will fail on unfixed code)
3. **Repeated Navigation Test**: Admin user navigates to admin-scheduler multiple times → verify user remains logged in each time (will fail on unfixed code)
4. **Auth State Persistence Test**: Verify localStorage contains valid KIU_AUTH_STATE before and after navigation attempt (will show state exists but is not restored on unfixed code)

**Expected Counterexamples**:
- User is redirected to login.html instead of seeing admin-scheduler page
- Authentication state exists in localStorage but is not restored during page load
- Possible causes: unreachable code preventing auth restoration, premature page reload, incorrect navigation path

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := navigate_fixed('admin-scheduler')
  ASSERT userRemainsAuthenticated(result)
  ASSERT pageLoadsSuccessfully(result, 'admin-scheduler')
  ASSERT noRedirectToLogin(result)
END FOR
```

**Test Cases**:
1. **Admin Scheduler Navigation Success**: Admin user navigates to admin-scheduler → verify user remains logged in and scheduler page loads
2. **Auth State Preserved**: Verify KIU_AUTH_STATE in localStorage is correctly restored after navigation
3. **No Login Redirect**: Verify no redirect to login.html occurs during navigation
4. **Scheduler UI Renders**: Verify scheduler interface elements are visible and functional after navigation

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT navigate_original(input.pageId) = navigate_fixed(input.pageId)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for other admin pages and SPA sections, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Admin Tools Navigation Preservation**: Observe that admin-tools navigation works correctly on unfixed code, then verify it continues working after fix
2. **Admin Library Navigation Preservation**: Observe that admin-library navigation works correctly on unfixed code, then verify it continues working after fix
3. **Admin Orders Navigation Preservation**: Observe that admin-orders navigation works correctly on unfixed code, then verify it continues working after fix
4. **Staff Navigation Preservation**: Observe that staff navigation works correctly on unfixed code, then verify it continues working after fix
5. **Students Admin Navigation Preservation**: Observe that students-admin navigation works correctly on unfixed code, then verify it continues working after fix
6. **Profile View Navigation Preservation**: Observe that profile-view navigation works correctly on unfixed code, then verify it continues working after fix
7. **SPA Section Navigation Preservation**: Observe that home, social, news, exams navigation works correctly on unfixed code, then verify it continues working after fix
8. **Non-Admin Navigation Preservation**: Observe that student, professor, TA, student service navigation works correctly on unfixed code, then verify it continues working after fix

### Unit Tests

- Test navigate('admin-scheduler') with authenticated admin user → verify no logout, page loads successfully
- Test navigate('admin-scheduler') with unauthenticated user → verify redirect to login.html (expected behavior)
- Test navigate('admin-tools') with authenticated admin user → verify navigation works (preservation)
- Test navigate('admin-library') with authenticated admin user → verify navigation works (preservation)
- Test navigate('admin-orders') with authenticated admin user → verify navigation works (preservation)
- Test navigate('staff') with authenticated admin user → verify navigation works (preservation)
- Test navigate('students-admin') with authenticated admin user → verify navigation works (preservation)
- Test navigate('profile-view') with authenticated admin user → verify navigation works (preservation)
- Test navigate('home') with authenticated user → verify SPA navigation works (preservation)
- Test navigate('social') with authenticated user → verify navigation works (preservation)

### Property-Based Tests

- Generate random authenticated admin users and verify admin-scheduler navigation preserves authentication for all
- Generate random page IDs (excluding admin-scheduler) and verify navigation behavior is unchanged for all
- Generate random user roles and verify role-specific navigation continues working for all
- Generate random navigation sequences and verify authentication state is preserved throughout

### Integration Tests

- Test full admin workflow: login → navigate to admin-scheduler → use scheduler → navigate to other admin pages → logout
- Test admin role switching: login as admin → switch to student view → switch back to admin → navigate to admin-scheduler
- Test session persistence: login → navigate to admin-scheduler → refresh page → verify user remains logged in
- Test multiple admin pages: navigate between admin-tools, admin-scheduler, admin-library, admin-orders in sequence
