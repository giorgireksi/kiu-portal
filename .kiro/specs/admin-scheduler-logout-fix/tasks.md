# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Admin Scheduler Navigation Preserves Authentication
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to admin users navigating to admin-scheduler page
  - Test that navigate('admin-scheduler') preserves authentication for authenticated admin users
  - Test assertions should verify:
    - User remains authenticated after navigation (no redirect to login.html)
    - Admin scheduler page loads successfully
    - Authentication state in localStorage is preserved
    - No logout occurs during navigation
  - Run test on UNFIXED code (with unreachable code block at lines ~350-360)
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found:
    - User is redirected to login.html instead of seeing admin-scheduler page
    - Authentication state exists but is not restored during page reload
    - Full page reload interrupts authentication restoration
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Other Navigation Paths Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-admin-scheduler navigation:
    - Admin Tools navigation (admin-tools)
    - Admin Library navigation (admin-library)
    - Admin Orders navigation (admin-orders)
    - Staff navigation (staff)
    - Students Admin navigation (students-admin)
    - Profile View navigation (profile-view)
    - SPA section navigation (home, social, news, exams)
  - Write property-based tests capturing observed behavior patterns:
    - For all pageId != 'admin-scheduler', navigation behavior is unchanged
    - Authentication is preserved for all other admin pages
    - SPA navigation continues to work without full page reloads
    - Role-specific navigation continues to work correctly
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Fix for admin scheduler logout bug

  - [x] 3.1 Remove unreachable code block in navigate() function
    - Open `assets/js/features/navigation.js`
    - Locate lines ~350-360 containing the unreachable code block:
      ```javascript
      const hardRouteUrl = resolvePortalRouteUrl(pageId, effectiveRole);
      window.location.assign(hardRouteUrl);
      return;
      ```
    - Remove or comment out this code block
    - This allows the subsequent navigation logic to execute properly
    - _Bug_Condition: isBugCondition(input) where input.pageId == 'admin-scheduler' AND input.userRole == 'admin' AND unreachableCodeBlockExists(navigate, lines 350-360)_
    - _Expected_Behavior: navigate('admin-scheduler') preserves authentication and loads page successfully without redirect to login.html_
    - _Preservation: All other navigation paths (admin-tools, admin-library, admin-orders, staff, students-admin, profile-view, SPA sections) continue working exactly as before_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 3.2 Verify admin-scheduler is in alwaysExternal array
    - Check that `alwaysExternal` array (line ~365) includes 'admin-scheduler'
    - Expected: `const alwaysExternal = ['admin-tools', 'admin-scheduler', 'staff', 'students-admin', 'profile-view'];`
    - If missing, add 'admin-scheduler' to the array
    - This ensures admin-scheduler uses the correct navigation path
    - _Requirements: 2.1, 2.2_

  - [x] 3.3 Verify admin-scheduler is in externalPages map
    - Check that `externalPages` object (line ~370) includes admin-scheduler mapping
    - Expected: `'admin-scheduler': 'admin-scheduler.html'`
    - If missing, add the mapping
    - This ensures the correct HTML file is loaded
    - _Requirements: 2.1, 2.3_

  - [x] 3.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Admin Scheduler Navigation Preserves Authentication
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify:
      - User remains authenticated after navigating to admin-scheduler
      - Admin scheduler page loads successfully
      - No redirect to login.html occurs
      - Authentication state is preserved throughout navigation
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - Other Navigation Paths Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Verify all other navigation paths continue working:
      - Admin Tools, Admin Library, Admin Orders navigation unchanged
      - Staff, Students Admin, Profile View navigation unchanged
      - SPA section navigation (home, social, news, exams) unchanged
      - Role-specific navigation unchanged
      - Authentication preservation for all other pages unchanged
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 4. Checkpoint - Ensure all tests pass
  - Run all tests (bug condition + preservation)
  - Verify all tests pass
  - Verify no regressions in other navigation paths
  - Test manual navigation flows:
    - Login as admin → navigate to admin-scheduler → verify page loads and user remains logged in
    - Navigate between admin-tools, admin-scheduler, admin-library in sequence
    - Navigate from admin-scheduler to SPA sections (home, social) and back
  - Ask the user if questions arise
