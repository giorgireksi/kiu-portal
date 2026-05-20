# Bugfix Requirements Document

## Introduction

When an admin user clicks the "admin-scheduler" navigation button, they are unexpectedly logged out and redirected to the login page instead of successfully navigating to the admin scheduler page. This bug prevents admins from accessing a critical administrative feature and disrupts their workflow.

The root cause is in the `navigate()` function in `assets/js/features/navigation.js` (lines ~350-360), where `window.location.assign(hardRouteUrl)` is called with an immediate return statement. This causes a full page reload instead of SPA-style navigation, and during the reload, the authentication state is not properly restored, triggering a redirect to login.html.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN an admin user clicks the "admin-scheduler" navigation button THEN the system calls `window.location.assign()` with the admin-scheduler.html URL and immediately returns

1.2 WHEN the system performs a full page reload to admin-scheduler.html THEN the authentication state fails to restore properly during the reload

1.3 WHEN the authentication state fails to restore during page reload THEN the system redirects the user to login.html, effectively logging them out

1.4 WHEN the user is redirected to login.html THEN the user loses access to the admin scheduler and must re-authenticate

### Expected Behavior (Correct)

2.1 WHEN an admin user clicks the "admin-scheduler" navigation button THEN the system SHALL navigate to admin-scheduler.html without triggering a full page reload that breaks authentication

2.2 WHEN navigating to admin-scheduler.html THEN the system SHALL preserve the user's authentication state throughout the navigation

2.3 WHEN the admin-scheduler page loads THEN the system SHALL display the scheduler interface with the user remaining logged in

2.4 WHEN the navigation completes THEN the system SHALL maintain the admin user's session without requiring re-authentication

### Unchanged Behavior (Regression Prevention)

3.1 WHEN an admin user navigates to other admin pages (admin-tools, admin-library, admin-orders) THEN the system SHALL CONTINUE TO navigate successfully while preserving authentication

3.2 WHEN a non-admin user navigates to their allowed pages THEN the system SHALL CONTINUE TO navigate successfully while preserving authentication

3.3 WHEN the `requireAuth()` function is called on page load for authenticated users THEN the system SHALL CONTINUE TO successfully restore auth state from localStorage

3.4 WHEN the `loadAuthState()` function is called THEN the system SHALL CONTINUE TO correctly parse and restore the user's authentication state

3.5 WHEN navigation occurs for pages with SPA sections (e.g., home, social, news) THEN the system SHALL CONTINUE TO use SPA-style navigation without full page reloads

3.6 WHEN the user is not authenticated and attempts to access a protected page THEN the system SHALL CONTINUE TO redirect to login.html as expected
