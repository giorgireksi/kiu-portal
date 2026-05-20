create table if not exists faculties (
    code text primary key,
    display_name text not null,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists academic_programs (
    id uuid primary key default gen_random_uuid(),
    program_code text not null unique,
    faculty_code text references faculties(code),
    display_name text not null,
    degree_level text,
    required_ects numeric(6,2),
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table portal_users add column if not exists display_name text;
alter table portal_users add column if not exists account_status text not null default 'active';
alter table portal_users add column if not exists last_login_at timestamptz;
alter table portal_users add column if not exists disabled_at timestamptz;
alter table portal_users add column if not exists disabled_reason text;
alter table portal_users add column if not exists source_system text not null default 'portal';

alter table student_profiles add column if not exists program_id uuid references academic_programs(id);
alter table student_profiles add column if not exists cohort_year integer;
alter table student_profiles add column if not exists academic_status text not null default 'active';
alter table student_profiles add column if not exists id_card_number_hash text;
alter table student_profiles add column if not exists finance_hold boolean not null default false;
alter table student_profiles add column if not exists exam_hold boolean not null default false;

alter table staff_profiles add column if not exists department_code text;
alter table staff_profiles add column if not exists staff_status text not null default 'active';

create table if not exists lms_roles (
    id uuid primary key default gen_random_uuid(),
    role_code text not null unique,
    display_name text not null,
    role_description text,
    is_system_role boolean not null default true,
    created_at timestamptz not null default now()
);

create table if not exists lms_permissions (
    id uuid primary key default gen_random_uuid(),
    permission_code text not null unique,
    display_name text not null,
    permission_description text,
    created_at timestamptz not null default now()
);

create table if not exists lms_role_permissions (
    role_id uuid not null references lms_roles(id) on delete cascade,
    permission_id uuid not null references lms_permissions(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (role_id, permission_id)
);

create table if not exists lms_user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references portal_users(id) on delete cascade,
    role_id uuid not null references lms_roles(id) on delete cascade,
    scope_type text not null default 'global',
    scope_id text not null default '*',
    starts_at timestamptz not null default now(),
    ends_at timestamptz,
    granted_by_user_id uuid references portal_users(id),
    created_at timestamptz not null default now(),
    unique (user_id, role_id, scope_type, scope_id)
);

create table if not exists section_staff_assignments (
    id uuid primary key default gen_random_uuid(),
    section_id uuid not null references portal_sections(id) on delete cascade,
    staff_user_id uuid not null references portal_users(id) on delete cascade,
    assignment_role text not null,
    can_publish_grades boolean not null default false,
    can_finalize_grades boolean not null default false,
    starts_at timestamptz not null default now(),
    ends_at timestamptz,
    created_at timestamptz not null default now(),
    unique (section_id, staff_user_id, assignment_role)
);

alter table assessment_items add column if not exists assessment_status text not null default 'draft';
alter table assessment_items add column if not exists visible_from timestamptz;
alter table assessment_items add column if not exists due_at timestamptz;

alter table score_entries add column if not exists score_status text not null default 'draft';
alter table score_entries add column if not exists graded_by_user_id uuid references portal_users(id) on delete set null;
alter table score_entries add column if not exists approved_by_user_id uuid references portal_users(id) on delete set null;
alter table score_entries add column if not exists published_at timestamptz;
alter table score_entries add column if not exists finalized_at timestamptz;

create table if not exists grade_audit_log (
    id uuid primary key default gen_random_uuid(),
    score_entry_id uuid references score_entries(id) on delete set null,
    course_id text,
    assessment_item_id uuid references assessment_items(id) on delete set null,
    student_user_id uuid references portal_users(id) on delete set null,
    actor_user_id uuid references portal_users(id) on delete set null,
    actor_role text,
    action_type text not null,
    old_score numeric(8,2),
    new_score numeric(8,2),
    old_status text,
    new_status text,
    reason text,
    before_state jsonb,
    after_state jsonb,
    created_at timestamptz not null default now()
);

insert into lms_roles (role_code, display_name, role_description) values
    ('student', 'Student', 'Learner account with access to enrolled academic activity.'),
    ('professor', 'Professor', 'Teaching owner for assigned sections and assessments.'),
    ('ta', 'Teaching Assistant', 'Delegated teaching support with scoped section permissions.'),
    ('registrar', 'Registrar', 'Academic records, programs, subjects, sections, and enrollment administration.'),
    ('student_service', 'Student Service', 'Student support desk with limited academic visibility.'),
    ('exam_proctor', 'Exam Proctor', 'Protected exam monitoring and incident response.'),
    ('faculty_admin', 'Faculty Admin', 'Faculty-level academic administration.'),
    ('admin', 'Platform Admin', 'System configuration and operational administration.')
on conflict (role_code) do nothing;

insert into lms_permissions (permission_code, display_name, permission_description) values
    ('lms.course.read', 'Read Courses', 'View assigned or enrolled LMS courses.'),
    ('lms.course.manage', 'Manage Courses', 'Create and update LMS course structure.'),
    ('lms.quiz.manage', 'Manage Quizzes', 'Create, launch, and close live quizzes.'),
    ('lms.exam.manage', 'Manage Exams', 'Create and schedule protected exams.'),
    ('lms.exam.proctor', 'Proctor Exams', 'Monitor active protected exam sessions.'),
    ('gradebook.read', 'Read Gradebook', 'View gradebook records within assigned scope.'),
    ('gradebook.score.write', 'Write Draft Scores', 'Enter or edit draft assessment scores.'),
    ('gradebook.publish', 'Publish Grades', 'Publish approved scores to students.'),
    ('gradebook.finalize', 'Finalize Grades', 'Lock final grades.'),
    ('records.enrollment.manage', 'Manage Enrollments', 'Create, update, and drop section enrollments.'),
    ('admin.audit.read', 'Read Audit Log', 'Inspect sensitive operational and academic audit events.'),
    ('admin.integrations.manage', 'Manage Integrations', 'Configure and run external-system syncs.')
on conflict (permission_code) do nothing;

create index if not exists idx_portal_users_microsoft_oid on portal_users (microsoft_oid);
create index if not exists idx_portal_users_email_status on portal_users (email, account_status);
create index if not exists idx_lms_user_roles_user_scope on lms_user_roles (user_id, scope_type, scope_id);
create index if not exists idx_section_staff_assignments_section_staff on section_staff_assignments (section_id, staff_user_id);
create index if not exists idx_score_entries_status_student on score_entries (score_status, student_user_id);
create index if not exists idx_grade_audit_course_created on grade_audit_log (course_id, created_at desc);
create index if not exists idx_grade_audit_student_created on grade_audit_log (student_user_id, created_at desc);
