import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('students admin LMS runtime smoke', () => {
  beforeEach(() => {
    document.body.innerHTML = '<main id="app-content"><section id="students-content"></section></main>';
    document.head.innerHTML = '';
    localStorage.clear();

    globalThis.KIU_STATE = {
      users: [],
      facultyProfiles: {
        CS: {
          students: [
            {
              id: '40012',
              name: 'Nino Tsereteli',
              nameEn: 'Nino Tsereteli',
              email: 'nino@student.kiu.edu.ge',
              phone: '+995555000111',
              role: 'student',
              faculty: 'CS',
              facultyCode: 'CS',
              status: 'Active',
              joinYear: 2025,
              program: 'BSc Computer Science',
              semester: 1,
              course: 2,
              gpa: 3.45,
              ectsEarned: 68,
              ects: 68,
              subjects: ['CS201']
            }
          ]
        }
      },
      tuitionBalances: { '40012': 0 },
      probationStatus: {},
      studentSchedulesByStudent: {
        '40012': [
          {
            courseId: 'CS201',
            courseName: 'Data Structures',
            groupId: 'G1',
            groupName: 'G1',
            faculty: 'CS',
            semester: 1,
            ects: 6,
            day: 'Mon',
            time: '10:00',
            room: 'A-301'
          }
        ]
      },
      studentGrades: {
        CS201: [
          { id: '40012', final: 88, letter: 'B+' }
        ]
      },
      availableGroups: {
        CS201: [
          { id: 'G1', name: 'G1', faculty: 'CS', semester: 1, ects: 6, day: 'Mon', time: '10:00', room: 'A-301', registered: 10 }
        ]
      }
    };

    globalThis.KIU_EMPTY_STATE = { facultyProfiles: {} };
    globalThis.getCurrentFaculty = () => 'CS';
    globalThis.normalizeFacultyCode = (code, fallback = 'CS') => String(code || fallback).trim().toUpperCase() || fallback;
    globalThis.getFacultyLabel = code => (code === 'CS' ? 'Computer Science' : code);
    globalThis.getFacultyProfile = code => ({ name: code === 'CS' ? 'Computer Science' : code, color: '#C2862A' });
    globalThis.getAllStudents = faculty => {
      const students = globalThis.KIU_STATE.facultyProfiles.CS.students;
      return faculty === 'all' || faculty === 'CS' ? students : [];
    };
    globalThis.getActiveCurriculum = () => [{ id: 'CS201', name: 'Data Structures', ects: 6, semester: 1, instructor: 'Prof. Nino Beridze' }];
    globalThis.getStudentDirectorySignals = () => ({ holdLabels: [], holdLabel: 'Clear' });
    globalThis.escapeDirectoryHtml = value => String(value ?? '');
    globalThis.queueEnglishLocalization = vi.fn();
    globalThis.saveState = vi.fn();
    globalThis.queueRealtimeUserSync = vi.fn();
    globalThis.buildProvisioningMeta = id => ({ temporaryPassword: `KIU-${id}`, microsoftProvisioned: true });
  });

  it('renders the replacement students-admin experience into the route mount point', () => {
    const source = readSource('assets/js/pages/students-admin-lms.js');

    new Function(source)();
    expect(typeof window.renderStudentsPage).toBe('function');

    window.renderStudentsPage();

    const root = document.getElementById('students-content');
    expect(root.innerHTML).toContain('Student operations in one surface.');
    expect(root.innerHTML).toContain('Operational directory');
    expect(root.innerHTML).toContain('Nino Tsereteli');
    expect(document.getElementById('students-admin-lms-modal')).not.toBeNull();
    expect(document.getElementById('students-admin-lms-toast')).not.toBeNull();
    expect(root.querySelector('.students-lms-table')).not.toBeNull();
    expect(root.querySelector('.kiu-table')).toBeNull();
  });
});
