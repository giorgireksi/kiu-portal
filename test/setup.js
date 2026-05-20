// Test setup file for vitest
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

global.localStorage = localStorageMock;

// Mock window.location
delete window.location;
window.location = {
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
  href: 'http://localhost/',
  pathname: '/index.html',
  search: '',
  hash: ''
};

// Mock alert
global.alert = vi.fn();

// Mock common portal globals that will be needed
global.USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
  PROFESSOR: 'professor',
  TA: 'ta',
  STUDENT_SERVICE: 'student-service'
};

global.currentUser = null;
global.KIU_STATE = {};
