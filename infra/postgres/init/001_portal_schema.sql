create extension if not exists "pgcrypto";

create table if not exists portal_users (
    id uuid primary key default gen_random_uuid(),
    legacy_user_id text unique,
    email text not null unique,
    microsoft_oid text unique,
    microsoft_tenant_id text,
    identity_provider text not null default 'local',
    actual_role text not null,
    faculty_code text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists student_profiles (
    user_id uuid primary key references portal_users(id) on delete cascade,
    student_number text unique,
    program_name text,
    current_semester integer,
    admission_year integer,
    status text,
    personal_number text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists staff_profiles (
    user_id uuid primary key references portal_users(id) on delete cascade,
    employee_number text unique,
    title text,
    department text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists portal_subjects (
    id uuid primary key default gen_random_uuid(),
    subject_code text not null unique,
    subject_name text not null,
    faculty_code text,
    ects numeric(5,2),
    curriculum_semester integer,
    lecture_seat_limit integer,
    seminar_seat_limit integer,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists portal_sections (
    id uuid primary key default gen_random_uuid(),
    subject_id uuid not null references portal_subjects(id) on delete cascade,
    section_code text not null,
    session_type text not null,
    instructor_user_id uuid references portal_users(id),
    assistant_user_id uuid references portal_users(id),
    seats_total integer not null default 0,
    seats_taken integer not null default 0,
    room_label text,
    day_label text,
    start_time time,
    end_time time,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (subject_id, section_code)
);

create table if not exists portal_enrollments (
    id uuid primary key default gen_random_uuid(),
    section_id uuid not null references portal_sections(id) on delete cascade,
    student_user_id uuid not null references portal_users(id) on delete cascade,
    enrolled_at timestamptz not null default now(),
    status text not null default 'active',
    unique (section_id, student_user_id)
);

create table if not exists portal_messages (
    id uuid primary key default gen_random_uuid(),
    chat_key text not null,
    sender_user_id uuid references portal_users(id),
    body text,
    attachment_file_id uuid,
    reply_to_message_id uuid,
    sent_at timestamptz not null default now(),
    deleted_at timestamptz
);

create table if not exists portal_calls (
    id uuid primary key default gen_random_uuid(),
    chat_key text not null,
    started_by_user_id uuid references portal_users(id),
    accepted_by_user_id uuid references portal_users(id),
    status text not null,
    started_at timestamptz not null default now(),
    accepted_at timestamptz,
    ended_at timestamptz
);

create table if not exists student_service_tickets (
    id uuid primary key default gen_random_uuid(),
    requester_user_id uuid references portal_users(id),
    assignee_user_id uuid references portal_users(id),
    service_area text not null,
    faculty_code text,
    status text not null,
    subject text,
    latest_preview text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists student_service_messages (
    id uuid primary key default gen_random_uuid(),
    ticket_id uuid not null references student_service_tickets(id) on delete cascade,
    author_user_id uuid references portal_users(id),
    body text not null,
    visibility text not null default 'public',
    created_at timestamptz not null default now()
);

create table if not exists portal_notifications (
    id uuid primary key default gen_random_uuid(),
    recipient_user_id uuid not null references portal_users(id) on delete cascade,
    source_domain text not null,
    type text not null,
    title text not null,
    body text,
    route_page text,
    route_data jsonb,
    is_read boolean not null default false,
    created_at timestamptz not null default now()
);

create table if not exists social_profiles (
    user_id uuid primary key references portal_users(id) on delete cascade,
    bio text,
    avatar_file_id uuid,
    cover_file_id uuid,
    visibility text not null default 'campus',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists social_posts (
    id uuid primary key default gen_random_uuid(),
    author_user_id uuid not null references portal_users(id) on delete cascade,
    post_type text not null,
    audience text not null default 'campus',
    body text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists social_post_media (
    id uuid primary key default gen_random_uuid(),
    post_id uuid not null references social_posts(id) on delete cascade,
    file_id uuid,
    media_type text not null,
    created_at timestamptz not null default now()
);

create table if not exists social_comments (
    id uuid primary key default gen_random_uuid(),
    post_id uuid not null references social_posts(id) on delete cascade,
    author_user_id uuid not null references portal_users(id) on delete cascade,
    parent_comment_id uuid references social_comments(id) on delete cascade,
    body text not null,
    created_at timestamptz not null default now()
);

create table if not exists social_follows (
    follower_user_id uuid not null references portal_users(id) on delete cascade,
    followed_user_id uuid not null references portal_users(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (follower_user_id, followed_user_id)
);
