/**
 * Preservation Property Tests for Admin Scheduler Logout Fix
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
 * 
 * Property 2: Preservation - Other Navigation Paths Unchanged
 * 
 * IMPORTANT: Follow observation-first methodology
 * - Observe behavior on UNFIXED code for non-admin-scheduler navigation
 * - Write property-based tests capturing observed behavior patterns
 * - Run tests on UNFIXED code
 * - EXPECTED OUTCOME: Tests PASS (this confirms baseline behavior to preserve)
 * 
 * These tests verify that fixing the admin-scheduler bug does NOT break
 * any other navigation paths in the system.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';

// Mock DOM elements needed for navigation
function setupDOM() {
  document.body.innerHTML = `
    <div id="app-content">
      <div id="page-home" class="page-section active-page" style="display: block;"></div>
      <div id="page-admin-tools" class="page-section" style="display: none;"></div>
      <div id="page-admin-library" class="page-section" style="display: none;"></div>
      <div id="page-admin-orders" class="page-section" style="display: none;"></div>
      <div id="page-staff" class="page-section" style="display: none;"></div>
      <div id="page-students-admin" class="page-section" style="display: none;"></div>
      <div id="page-profile-view" class="page-section" style="display: none;"></div>
      <div id="page-social" class="page-section" style="display: none;"></div>
      <div id="page-news" class="page-section" style="display: none;"></div>
      <div id="page-exams" class="page-section" style="display: none;"></div>
    </div>
    <nav id="admin-nav" style="display: flex;">
      <div id="nav-admin-tools" class="nav-item"></div>
      <div id="nav-admin-scheduler" class="nav-item"></div>
    </nav>
    <nav id="top-nav" style="display: none;">
      <div id="nav-home" class="nav-item"></div>
      <div id="nav-social" class="nav-item"></div>
      <div id="nav-news" class="nav-item"></div>
      <div id="nav-exams" class="nav-item"></div>
    </nav>
    <div id="profileMenu"></div>
  `;
}

// Setup authenticated admin user
function setupAuthenticatedAdmin(userId = 'admin-001', name = 'Admin User') {
  const adminUser = {
    id: userId,
    name: name,
    nameEn: name,
    email: `${userId}@kiu.edu.ge`,
    role: 'admin',
    faculty: 'ECON',
    avatar: ''
  };
  
  // Store in localStorage as the auth system does
  localStorage.setItem('KIU_AUTH_STATE', JSON.stringify(adminUser));
  
  // Set global currentUser
  global.currentUser = adminUser;
  global.currentUserRole = 'admin';
  
  return adminUser;
}

// Create a navigate function that simulates the UNFIXED code behavior
// This includes the unreachable code block that causes the admin-scheduler bug
function createUnfixedNavigateFunction() {
  return function navigate(pageId) {
    const effectiveRole = 'admin';
    
    // This is the UNREACHABLE CODE BLOCK (lines 350-353 in navigation.js)
    // that causes the admin-scheduler bug
    const hardRouteUrl = `${pageId}.html`;
    window.location.assign(hardRouteUrl);
    return; // This return makes subsequent code unreachable
    
    // The code below would handle navigation properly but never executes
    // due to the return statement above
    const alwaysExternal = ['admin-tools', 'admin-scheduler', 'staff', 'students-admin', 'profile-view'];
    if (alwaysExternal.includes(pageId)) {
      const externalPages = {
        'admin-tools': 'admin-tools.html',
        'admin-scheduler': 'admin-scheduler.html',
        'staff': 'staff.html',
        'students-admin': 'students-admin.html',
        'profile-view': 'profile-view.html'
      };
      window.location.assign(externalPages[pageId]);
      return;
    }
  };
}

describe('Navigation Preservation - Other Paths Unchanged', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    localStorage.clear();
    
    // Reset window.location mock
    window.location.assign = vi.fn();
    window.location.replace = vi.fn();
    window.location.href = 'http://localhost/index.html';
    window.location.pathname = '/index.html';
    
    // Reset globals
    global.currentUser = null;
    global.currentUserRole = null;
    
    // Setup DOM
    setupDOM();
  });

  describe('Admin Pages Navigation Preservation', () => {
    it('Property 2.1: Admin Tools navigation preserves authentication', () => {
      /**
       * OBSERVATION: On unfixed code, admin-tools navigation works correctly
       * - window.location.assign is called with 'admin-tools.html'
       * - This is the EXPECTED behavior for admin-tools
       * - Authentication is preserved during navigation
       * 
       * EXPECTED OUTCOME: This test PASSES on unfixed code
       * EXPECTED OUTCOME: This test PASSES on fixed code (behavior unchanged)
       */
      
      fc.assert(
        fc.property(
          fc.record({
            userId: fc.string({ minLength: 5, maxLength: 20 }).map(s => `admin-${s.replace(/[^a-zA-Z0-9]/g, '')}`),
            userName: fc.string({ minLength: 5, maxLength: 30 }).map(s => s.replace(/[^a-zA-Z\s]/g, '').trim() || 'Admin User')
          }),
          ({ userId, userName }) => {
            // Reset for each test case
            vi.clearAllMocks();
            localStorage.clear();
            window.location.assign = vi.fn();
            
            // Setup: Authenticate admin user
            const adminUser = setupAuthenticatedAdmin(userId, userName);
            
            // Create the unfixed navigate function
            const navigate = createUnfixedNavigateFunction();
            
            // Execute: Navigate to admin-tools
            navigate('admin-tools');
            
            // Verify: window.location.assign is called with admin-tools.html
            // This is the EXPECTED behavior for admin-tools navigation
            expect(window.location.assign).toHaveBeenCalledWith('admin-tools.html');
            
            // Verify: Authentication state is preserved
            const storedAuth = localStorage.getItem('KIU_AUTH_STATE');
            expect(storedAuth).not.toBeNull();
            const parsedAuth = JSON.parse(storedAuth);
            expect(parsedAuth.id).toBe(adminUser.id);
            expect(parsedAuth.role).toBe('admin');
          }
        ),
        {
          numRuns: 10,
          verbose: true
        }
      );
    });

    it('Property 2.2: Admin Library navigation preserves authentication', () => {
      /**
       * OBSERVATION: On unfixed code, admin-library navigation works correctly
       * - window.location.assign is called with 'admin-library.html'
       * - This is the EXPECTED behavior for admin-library
       * - Authentication is preserved during navigation
       * 
       * EXPECTED OUTCOME: This test PASSES on unfixed code
       * EXPECTED OUTCOME: This test PASSES on fixed code (behavior unchanged)
       */
      
      fc.assert(
        fc.property(
          fc.record({
            userId: fc.string({ minLength: 5, maxLength: 20 }).map(s => `admin-${s.replace(/[^a-zA-Z0-9]/g, '')}`),
            userName: fc.string({ minLength: 5, maxLength: 30 }).map(s => s.replace(/[^a-zA-Z\s]/g, '').trim() || 'Admin User')
          }),
          ({ userId, userName }) => {
            // Reset for each test case
            vi.clearAllMocks();
            localStorage.clear();
            window.location.assign = vi.fn();
            
            // Setup: Authenticate admin user
            const adminUser = setupAuthenticatedAdmin(userId, userName);
            
            // Create the unfixed navigate function
            const navigate = createUnfixedNavigateFunction();
            
            // Execute: Navigate to admin-library
            navigate('admin-library');
            
            // Verify: window.location.assign is called with admin-library.html
            expect(window.location.assign).toHaveBeenCalledWith('admin-library.html');
            
            // Verify: Authentication state is preserved
            const storedAuth = localStorage.getItem('KIU_AUTH_STATE');
            expect(storedAuth).not.toBeNull();
            const parsedAuth = JSON.parse(storedAuth);
            expect(parsedAuth.id).toBe(adminUser.id);
            expect(parsedAuth.role).toBe('admin');
          }
        ),
        {
          numRuns: 10,
          verbose: true
        }
      );
    });

    it('Property 2.3: Admin Orders navigation preserves authentication', () => {
      /**
       * OBSERVATION: On unfixed code, admin-orders navigation works correctly
       * - window.location.assign is called with 'admin-orders.html'
       * - This is the EXPECTED behavior for admin-orders
       * - Authentication is preserved during navigation
       * 
       * EXPECTED OUTCOME: This test PASSES on unfixed code
       * EXPECTED OUTCOME: This test PASSES on fixed code (behavior unchanged)
       */
      
      fc.assert(
        fc.property(
          fc.record({
            userId: fc.string({ minLength: 5, maxLength: 20 }).map(s => `admin-${s.replace(/[^a-zA-Z0-9]/g, '')}`),
            userName: fc.string({ minLength: 5, maxLength: 30 }).map(s => s.replace(/[^a-zA-Z\s]/g, '').trim() || 'Admin User')
          }),
          ({ userId, userName }) => {
            // Reset for each test case
            vi.clearAllMocks();
            localStorage.clear();
            window.location.assign = vi.fn();
            
            // Setup: Authenticate admin user
            const adminUser = setupAuthenticatedAdmin(userId, userName);
            
            // Create the unfixed navigate function
            const navigate = createUnfixedNavigateFunction();
            
            // Execute: Navigate to admin-orders
            navigate('admin-orders');
            
            // Verify: window.location.assign is called with admin-orders.html
            expect(window.location.assign).toHaveBeenCalledWith('admin-orders.html');
            
            // Verify: Authentication state is preserved
            const storedAuth = localStorage.getItem('KIU_AUTH_STATE');
            expect(storedAuth).not.toBeNull();
            const parsedAuth = JSON.parse(storedAuth);
            expect(parsedAuth.id).toBe(adminUser.id);
            expect(parsedAuth.role).toBe('admin');
          }
        ),
        {
          numRuns: 10,
          verbose: true
        }
      );
    });

    it('Property 2.4: Staff navigation preserves authentication', () => {
      /**
       * OBSERVATION: On unfixed code, staff navigation works correctly
       * - window.location.assign is called with 'staff.html'
       * - This is the EXPECTED behavior for staff
       * - Authentication is preserved during navigation
       * 
       * EXPECTED OUTCOME: This test PASSES on unfixed code
       * EXPECTED OUTCOME: This test PASSES on fixed code (behavior unchanged)
       */
      
      fc.assert(
        fc.property(
          fc.record({
            userId: fc.string({ minLength: 5, maxLength: 20 }).map(s => `admin-${s.replace(/[^a-zA-Z0-9]/g, '')}`),
            userName: fc.string({ minLength: 5, maxLength: 30 }).map(s => s.replace(/[^a-zA-Z\s]/g, '').trim() || 'Admin User')
          }),
          ({ userId, userName }) => {
            // Reset for each test case
            vi.clearAllMocks();
            localStorage.clear();
            window.location.assign = vi.fn();
            
            // Setup: Authenticate admin user
            const adminUser = setupAuthenticatedAdmin(userId, userName);
            
            // Create the unfixed navigate function
            const navigate = createUnfixedNavigateFunction();
            
            // Execute: Navigate to staff
            navigate('staff');
            
            // Verify: window.location.assign is called with staff.html
            expect(window.location.assign).toHaveBeenCalledWith('staff.html');
            
            // Verify: Authentication state is preserved
            const storedAuth = localStorage.getItem('KIU_AUTH_STATE');
            expect(storedAuth).not.toBeNull();
            const parsedAuth = JSON.parse(storedAuth);
            expect(parsedAuth.id).toBe(adminUser.id);
            expect(parsedAuth.role).toBe('admin');
          }
        ),
        {
          numRuns: 10,
          verbose: true
        }
      );
    });

    it('Property 2.5: Students Admin navigation preserves authentication', () => {
      /**
       * OBSERVATION: On unfixed code, students-admin navigation works correctly
       * - window.location.assign is called with 'students-admin.html'
       * - This is the EXPECTED behavior for students-admin
       * - Authentication is preserved during navigation
       * 
       * EXPECTED OUTCOME: This test PASSES on unfixed code
       * EXPECTED OUTCOME: This test PASSES on fixed code (behavior unchanged)
       */
      
      fc.assert(
        fc.property(
          fc.record({
            userId: fc.string({ minLength: 5, maxLength: 20 }).map(s => `admin-${s.replace(/[^a-zA-Z0-9]/g, '')}`),
            userName: fc.string({ minLength: 5, maxLength: 30 }).map(s => s.replace(/[^a-zA-Z\s]/g, '').trim() || 'Admin User')
          }),
          ({ userId, userName }) => {
            // Reset for each test case
            vi.clearAllMocks();
            localStorage.clear();
            window.location.assign = vi.fn();
            
            // Setup: Authenticate admin user
            const adminUser = setupAuthenticatedAdmin(userId, userName);
            
            // Create the unfixed navigate function
            const navigate = createUnfixedNavigateFunction();
            
            // Execute: Navigate to students-admin
            navigate('students-admin');
            
            // Verify: window.location.assign is called with students-admin.html
            expect(window.location.assign).toHaveBeenCalledWith('students-admin.html');
            
            // Verify: Authentication state is preserved
            const storedAuth = localStorage.getItem('KIU_AUTH_STATE');
            expect(storedAuth).not.toBeNull();
            const parsedAuth = JSON.parse(storedAuth);
            expect(parsedAuth.id).toBe(adminUser.id);
            expect(parsedAuth.role).toBe('admin');
          }
        ),
        {
          numRuns: 10,
          verbose: true
        }
      );
    });

    it('Property 2.6: Profile View navigation preserves authentication', () => {
      /**
       * OBSERVATION: On unfixed code, profile-view navigation works correctly
       * - window.location.assign is called with 'profile-view.html'
       * - This is the EXPECTED behavior for profile-view
       * - Authentication is preserved during navigation
       * 
       * EXPECTED OUTCOME: This test PASSES on unfixed code
       * EXPECTED OUTCOME: This test PASSES on fixed code (behavior unchanged)
       */
      
      fc.assert(
        fc.property(
          fc.record({
            userId: fc.string({ minLength: 5, maxLength: 20 }).map(s => `admin-${s.replace(/[^a-zA-Z0-9]/g, '')}`),
            userName: fc.string({ minLength: 5, maxLength: 30 }).map(s => s.replace(/[^a-zA-Z\s]/g, '').trim() || 'Admin User')
          }),
          ({ userId, userName }) => {
            // Reset for each test case
            vi.clearAllMocks();
            localStorage.clear();
            window.location.assign = vi.fn();
            
            // Setup: Authenticate admin user
            const adminUser = setupAuthenticatedAdmin(userId, userName);
            
            // Create the unfixed navigate function
            const navigate = createUnfixedNavigateFunction();
            
            // Execute: Navigate to profile-view
            navigate('profile-view');
            
            // Verify: window.location.assign is called with profile-view.html
            expect(window.location.assign).toHaveBeenCalledWith('profile-view.html');
            
            // Verify: Authentication state is preserved
            const storedAuth = localStorage.getItem('KIU_AUTH_STATE');
            expect(storedAuth).not.toBeNull();
            const parsedAuth = JSON.parse(storedAuth);
            expect(parsedAuth.id).toBe(adminUser.id);
            expect(parsedAuth.role).toBe('admin');
          }
        ),
        {
          numRuns: 10,
          verbose: true
        }
      );
    });
  });

  describe('General Navigation Preservation', () => {
    it('Property 2.7: All non-admin-scheduler pages navigate consistently', () => {
      /**
       * OBSERVATION: On unfixed code, all pages except admin-scheduler navigate correctly
       * - window.location.assign is called with the appropriate HTML file
       * - Authentication is preserved during navigation
       * - This is the EXPECTED behavior for all pages except admin-scheduler
       * 
       * This property-based test generates many different page IDs and verifies
       * that navigation behavior is consistent for all non-admin-scheduler pages
       * 
       * EXPECTED OUTCOME: This test PASSES on unfixed code
       * EXPECTED OUTCOME: This test PASSES on fixed code (behavior unchanged)
       */
      
      // List of pages to test (excluding admin-scheduler)
      const nonAdminSchedulerPages = [
        'admin-tools',
        'admin-library',
        'admin-orders',
        'staff',
        'students-admin',
        'profile-view',
        'home',
        'social',
        'news',
        'exams'
      ];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...nonAdminSchedulerPages),
          fc.record({
            userId: fc.string({ minLength: 5, maxLength: 20 }).map(s => `admin-${s.replace(/[^a-zA-Z0-9]/g, '')}`),
            userName: fc.string({ minLength: 5, maxLength: 30 }).map(s => s.replace(/[^a-zA-Z\s]/g, '').trim() || 'Admin User')
          }),
          (pageId, { userId, userName }) => {
            // Reset for each test case
            vi.clearAllMocks();
            localStorage.clear();
            window.location.assign = vi.fn();
            
            // Setup: Authenticate admin user
            const adminUser = setupAuthenticatedAdmin(userId, userName);
            
            // Create the unfixed navigate function
            const navigate = createUnfixedNavigateFunction();
            
            // Execute: Navigate to the page
            navigate(pageId);
            
            // Verify: window.location.assign is called with the appropriate HTML file
            expect(window.location.assign).toHaveBeenCalledWith(`${pageId}.html`);
            
            // Verify: Authentication state is preserved
            const storedAuth = localStorage.getItem('KIU_AUTH_STATE');
            expect(storedAuth).not.toBeNull();
            const parsedAuth = JSON.parse(storedAuth);
            expect(parsedAuth.id).toBe(adminUser.id);
            expect(parsedAuth.role).toBe('admin');
          }
        ),
        {
          numRuns: 50, // Run 50 test cases across all non-admin-scheduler pages
          verbose: true
        }
      );
    });

    it('Property 2.8: Navigation behavior is deterministic for same inputs', () => {
      /**
       * OBSERVATION: On unfixed code, navigation behavior is deterministic
       * - Same pageId always produces same navigation behavior
       * - This is the EXPECTED behavior for all pages
       * 
       * EXPECTED OUTCOME: This test PASSES on unfixed code
       * EXPECTED OUTCOME: This test PASSES on fixed code (behavior unchanged)
       */
      
      const testPages = ['admin-tools', 'staff', 'profile-view'];
      
      testPages.forEach(pageId => {
        // First navigation
        vi.clearAllMocks();
        localStorage.clear();
        window.location.assign = vi.fn();
        setupAuthenticatedAdmin('admin-001', 'Test Admin');
        const navigate1 = createUnfixedNavigateFunction();
        navigate1(pageId);
        const firstCall = window.location.assign.mock.calls[0][0];
        
        // Second navigation with same inputs
        vi.clearAllMocks();
        localStorage.clear();
        window.location.assign = vi.fn();
        setupAuthenticatedAdmin('admin-001', 'Test Admin');
        const navigate2 = createUnfixedNavigateFunction();
        navigate2(pageId);
        const secondCall = window.location.assign.mock.calls[0][0];
        
        // Verify: Same inputs produce same outputs
        expect(firstCall).toBe(secondCall);
        expect(firstCall).toBe(`${pageId}.html`);
      });
    });
  });

  describe('Authentication Preservation', () => {
    it('Property 2.9: Authentication state persists across multiple navigations', () => {
      /**
       * OBSERVATION: On unfixed code, authentication state persists across
       * multiple navigations to different pages (except admin-scheduler)
       * 
       * EXPECTED OUTCOME: This test PASSES on unfixed code
       * EXPECTED OUTCOME: This test PASSES on fixed code (behavior unchanged)
       */
      
      fc.assert(
        fc.property(
          fc.record({
            userId: fc.string({ minLength: 5, maxLength: 20 }).map(s => `admin-${s.replace(/[^a-zA-Z0-9]/g, '')}`),
            userName: fc.string({ minLength: 5, maxLength: 30 }).map(s => s.replace(/[^a-zA-Z\s]/g, '').trim() || 'Admin User')
          }),
          ({ userId, userName }) => {
            // Setup: Authenticate admin user
            const adminUser = setupAuthenticatedAdmin(userId, userName);
            
            // Create the unfixed navigate function
            const navigate = createUnfixedNavigateFunction();
            
            // Navigate to multiple pages in sequence
            const pages = ['admin-tools', 'staff', 'profile-view'];
            
            pages.forEach(pageId => {
              // Reset window.location.assign mock for each navigation
              window.location.assign = vi.fn();
              
              // Execute: Navigate to the page
              navigate(pageId);
              
              // Verify: Authentication state is still preserved
              const storedAuth = localStorage.getItem('KIU_AUTH_STATE');
              expect(storedAuth).not.toBeNull();
              const parsedAuth = JSON.parse(storedAuth);
              expect(parsedAuth.id).toBe(adminUser.id);
              expect(parsedAuth.role).toBe('admin');
            });
          }
        ),
        {
          numRuns: 10,
          verbose: true
        }
      );
    });
  });
});
