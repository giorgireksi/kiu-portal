create table if not exists auth_credentials (
    user_id uuid primary key references portal_users(id) on delete cascade,
    password_hash text,
    temporary_password_hash text,
    activation_required boolean not null default true,
    must_change_password boolean not null default false,
    activated_at timestamptz,
    updated_at timestamptz not null default now()
);

create table if not exists portal_sessions (
    token text primary key,
    user_id uuid not null references portal_users(id) on delete cascade,
    actual_role text not null,
    preview_role text not null,
    faculty_code text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    last_seen_at timestamptz not null default now()
);

create table if not exists file_objects (
    id uuid primary key default gen_random_uuid(),
    owner_user_id uuid references portal_users(id) on delete set null,
    file_name text not null,
    content_type text not null,
    byte_size bigint not null default 0,
    storage_backend text not null default 's3',
    storage_key text not null unique,
    file_scope text not null default 'general',
    retention_class text not null default 'standard',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists chat_threads (
    id uuid primary key default gen_random_uuid(),
    legacy_chat_key text unique,
    thread_type text not null,
    display_name text,
    created_by_user_id uuid references portal_users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists chat_thread_members (
    thread_id uuid not null references chat_threads(id) on delete cascade,
    user_id uuid not null references portal_users(id) on delete cascade,
    membership_role text not null default 'member',
    request_state text not null default 'accepted',
    hidden_at timestamptz,
    joined_at timestamptz not null default now(),
    primary key (thread_id, user_id)
);

create table if not exists message_receipts (
    message_id uuid not null references portal_messages(id) on delete cascade,
    user_id uuid not null references portal_users(id) on delete cascade,
    seen_at timestamptz not null default now(),
    primary key (message_id, user_id)
);

create table if not exists academic_terms (
    id uuid primary key default gen_random_uuid(),
    term_code text not null unique,
    display_name text not null,
    faculty_code text,
    term_status text not null default 'planned',
    starts_on date,
    ends_on date,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists assessment_items (
    id uuid primary key default gen_random_uuid(),
    section_id uuid references portal_sections(id) on delete cascade,
    assessment_key text not null,
    display_name text not null,
    assessment_number integer not null default 1,
    max_score numeric(8,2) not null default 100,
    weight_percent numeric(6,2),
    is_published boolean not null default false,
    created_by_user_id uuid references portal_users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (section_id, assessment_key, assessment_number)
);

create table if not exists score_entries (
    id uuid primary key default gen_random_uuid(),
    assessment_item_id uuid not null references assessment_items(id) on delete cascade,
    student_user_id uuid not null references portal_users(id) on delete cascade,
    raw_score numeric(8,2),
    score_note text,
    is_finalized boolean not null default false,
    updated_by_user_id uuid references portal_users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (assessment_item_id, student_user_id)
);

create table if not exists grade_publications (
    id uuid primary key default gen_random_uuid(),
    assessment_item_id uuid references assessment_items(id) on delete cascade,
    section_id uuid references portal_sections(id) on delete cascade,
    published_by_user_id uuid references portal_users(id) on delete set null,
    publication_scope text not null default 'assessment',
    published_at timestamptz not null default now()
);

create table if not exists import_jobs (
    id uuid primary key default gen_random_uuid(),
    import_type text not null,
    requested_by_user_id uuid references portal_users(id) on delete set null,
    dry_run boolean not null default true,
    row_count integer not null default 0,
    job_status text not null default 'queued',
    error_report jsonb,
    created_at timestamptz not null default now(),
    finished_at timestamptz
);

create index if not exists idx_portal_sessions_user_active on portal_sessions (user_id, is_active);
create index if not exists idx_chat_thread_members_user on chat_thread_members (user_id, joined_at desc);
create index if not exists idx_assessment_items_section on assessment_items (section_id, assessment_key, assessment_number);
create index if not exists idx_score_entries_student on score_entries (student_user_id, updated_at desc);
create index if not exists idx_import_jobs_status on import_jobs (job_status, created_at desc);
