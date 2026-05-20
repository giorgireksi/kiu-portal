create table if not exists external_systems (
    id uuid primary key default gen_random_uuid(),
    system_code text not null unique,
    display_name text not null,
    owner_domain text not null,
    base_url text,
    sync_mode text not null default 'event-driven',
    is_authoritative boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists external_record_links (
    id uuid primary key default gen_random_uuid(),
    external_system_id uuid not null references external_systems(id) on delete cascade,
    local_table text not null,
    local_record_id text not null,
    external_record_key text not null,
    sync_status text not null default 'linked',
    last_synced_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (external_system_id, local_table, local_record_id)
);

create table if not exists sync_runs (
    id uuid primary key default gen_random_uuid(),
    external_system_id uuid not null references external_systems(id) on delete cascade,
    sync_scope text not null,
    run_status text not null,
    started_at timestamptz not null default now(),
    finished_at timestamptz,
    records_seen integer not null default 0,
    records_changed integer not null default 0,
    error_summary text
);

create table if not exists sync_conflicts (
    id uuid primary key default gen_random_uuid(),
    sync_run_id uuid references sync_runs(id) on delete cascade,
    external_system_id uuid references external_systems(id) on delete cascade,
    entity_type text not null,
    local_record_id text,
    external_record_key text,
    conflict_field text not null,
    local_value jsonb,
    external_value jsonb,
    resolution_status text not null default 'open',
    resolved_by_user_id uuid references portal_users(id),
    resolved_at timestamptz,
    created_at timestamptz not null default now()
);

create table if not exists audit_events (
    id uuid primary key default gen_random_uuid(),
    actor_user_id uuid references portal_users(id),
    actor_role text,
    event_domain text not null,
    event_type text not null,
    entity_type text not null,
    entity_id text not null,
    before_state jsonb,
    after_state jsonb,
    source_system text not null default 'portal',
    request_id text,
    ip_address inet,
    created_at timestamptz not null default now()
);

create table if not exists admissions_applications (
    id uuid primary key default gen_random_uuid(),
    applicant_user_id uuid references portal_users(id),
    application_number text not null unique,
    faculty_code text,
    program_name text,
    admission_term text,
    application_status text not null default 'submitted',
    decision_status text not null default 'pending',
    submitted_at timestamptz,
    decided_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists admissions_offers (
    id uuid primary key default gen_random_uuid(),
    application_id uuid not null references admissions_applications(id) on delete cascade,
    offer_status text not null,
    offer_expires_at timestamptz,
    accepted_at timestamptz,
    deferred_to_term text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists student_status_history (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references portal_users(id) on delete cascade,
    status_code text not null,
    reason_code text,
    effective_from timestamptz not null,
    effective_to timestamptz,
    source_system text not null default 'sis',
    created_at timestamptz not null default now()
);

create table if not exists graduation_audits (
    id uuid primary key default gen_random_uuid(),
    student_user_id uuid not null references portal_users(id) on delete cascade,
    program_name text not null,
    audit_status text not null default 'in_progress',
    required_ects numeric(5,2),
    completed_ects numeric(5,2),
    outstanding_requirements jsonb,
    reviewed_by_user_id uuid references portal_users(id),
    reviewed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists finance_accounts (
    id uuid primary key default gen_random_uuid(),
    student_user_id uuid not null references portal_users(id) on delete cascade,
    external_account_key text,
    balance_amount numeric(12,2) not null default 0,
    currency_code text not null default 'GEL',
    account_status text not null default 'active',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (student_user_id)
);

create table if not exists finance_charges (
    id uuid primary key default gen_random_uuid(),
    finance_account_id uuid not null references finance_accounts(id) on delete cascade,
    charge_type text not null,
    description text not null,
    amount numeric(12,2) not null,
    due_at timestamptz,
    charge_status text not null default 'open',
    source_system text not null default 'finance',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists finance_payments (
    id uuid primary key default gen_random_uuid(),
    finance_account_id uuid not null references finance_accounts(id) on delete cascade,
    external_payment_key text,
    payment_method text,
    amount numeric(12,2) not null,
    paid_at timestamptz not null,
    reconciliation_status text not null default 'pending',
    created_at timestamptz not null default now()
);

create table if not exists finance_holds (
    id uuid primary key default gen_random_uuid(),
    student_user_id uuid not null references portal_users(id) on delete cascade,
    hold_code text not null,
    hold_reason text,
    blocks_registration boolean not null default false,
    blocks_graduation boolean not null default false,
    is_active boolean not null default true,
    placed_at timestamptz not null default now(),
    released_at timestamptz
);

create table if not exists scholarships (
    id uuid primary key default gen_random_uuid(),
    student_user_id uuid not null references portal_users(id) on delete cascade,
    scholarship_name text not null,
    scholarship_type text not null,
    amount numeric(12,2),
    percent_value numeric(5,2),
    effective_from date,
    effective_to date,
    scholarship_status text not null default 'active',
    created_at timestamptz not null default now()
);

create table if not exists payment_plans (
    id uuid primary key default gen_random_uuid(),
    student_user_id uuid not null references portal_users(id) on delete cascade,
    plan_name text not null,
    installment_count integer not null,
    plan_status text not null default 'active',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists hr_departments (
    id uuid primary key default gen_random_uuid(),
    faculty_code text,
    department_code text not null unique,
    department_name text not null,
    created_at timestamptz not null default now()
);

create table if not exists staff_contracts (
    id uuid primary key default gen_random_uuid(),
    staff_user_id uuid not null references portal_users(id) on delete cascade,
    department_id uuid references hr_departments(id),
    employment_status text not null,
    contract_type text,
    starts_on date,
    ends_on date,
    workload_percent numeric(5,2),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists teaching_load_assignments (
    id uuid primary key default gen_random_uuid(),
    section_id uuid references portal_sections(id) on delete cascade,
    staff_user_id uuid not null references portal_users(id) on delete cascade,
    assignment_role text not null,
    load_hours numeric(6,2),
    assignment_status text not null default 'active',
    created_at timestamptz not null default now()
);

create table if not exists staff_leaves (
    id uuid primary key default gen_random_uuid(),
    staff_user_id uuid not null references portal_users(id) on delete cascade,
    leave_type text not null,
    starts_on date not null,
    ends_on date not null,
    approval_status text not null default 'pending',
    substitute_staff_user_id uuid references portal_users(id),
    created_at timestamptz not null default now()
);

create table if not exists user_presence (
    user_id uuid primary key references portal_users(id) on delete cascade,
    presence_state text not null default 'offline',
    presence_message text,
    last_seen_at timestamptz,
    updated_at timestamptz not null default now()
);

create table if not exists contact_permissions (
    id uuid primary key default gen_random_uuid(),
    source_user_id uuid not null references portal_users(id) on delete cascade,
    target_user_id uuid not null references portal_users(id) on delete cascade,
    channel_type text not null,
    permission_state text not null default 'allowed',
    reason_code text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (source_user_id, target_user_id, channel_type)
);

create table if not exists message_blocks (
    id uuid primary key default gen_random_uuid(),
    blocker_user_id uuid not null references portal_users(id) on delete cascade,
    blocked_user_id uuid not null references portal_users(id) on delete cascade,
    applies_to_calls boolean not null default true,
    applies_to_messages boolean not null default true,
    created_at timestamptz not null default now(),
    unique (blocker_user_id, blocked_user_id)
);

create table if not exists support_referrals (
    id uuid primary key default gen_random_uuid(),
    source_ticket_id uuid references student_service_tickets(id) on delete set null,
    source_office text not null,
    target_office text not null,
    student_user_id uuid references portal_users(id),
    referral_reason text,
    referral_status text not null default 'open',
    confidentiality_level text not null default 'standard',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists campus_rooms (
    id uuid primary key default gen_random_uuid(),
    room_code text not null unique,
    building_name text,
    capacity integer,
    room_type text,
    managed_by_department text,
    created_at timestamptz not null default now()
);

create table if not exists facilities_tickets (
    id uuid primary key default gen_random_uuid(),
    room_id uuid references campus_rooms(id) on delete set null,
    reported_by_user_id uuid references portal_users(id),
    issue_type text not null,
    issue_summary text not null,
    priority_level text not null default 'normal',
    ticket_status text not null default 'open',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists housing_assignments (
    id uuid primary key default gen_random_uuid(),
    student_user_id uuid not null references portal_users(id) on delete cascade,
    housing_unit_code text not null,
    assignment_status text not null default 'active',
    starts_on date,
    ends_on date,
    created_at timestamptz not null default now()
);

create table if not exists asset_loans (
    id uuid primary key default gen_random_uuid(),
    borrower_user_id uuid not null references portal_users(id) on delete cascade,
    asset_code text not null,
    asset_description text,
    loan_status text not null default 'checked_out',
    checked_out_at timestamptz not null default now(),
    due_at timestamptz,
    returned_at timestamptz
);

create table if not exists social_reports (
    id uuid primary key default gen_random_uuid(),
    reporter_user_id uuid references portal_users(id),
    target_entity_type text not null,
    target_entity_id text not null,
    report_reason text not null,
    report_status text not null default 'open',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists moderation_actions (
    id uuid primary key default gen_random_uuid(),
    report_id uuid references social_reports(id) on delete set null,
    moderator_user_id uuid references portal_users(id),
    target_entity_type text not null,
    target_entity_id text not null,
    action_type text not null,
    action_reason text,
    created_at timestamptz not null default now()
);

create index if not exists idx_audit_events_domain_created on audit_events (event_domain, created_at desc);
create index if not exists idx_sync_conflicts_status on sync_conflicts (resolution_status, created_at desc);
create index if not exists idx_student_status_history_user on student_status_history (user_id, effective_from desc);
create index if not exists idx_finance_holds_student_active on finance_holds (student_user_id, is_active);
create index if not exists idx_contact_permissions_source_target on contact_permissions (source_user_id, target_user_id);
create index if not exists idx_social_reports_status on social_reports (report_status, created_at desc);
