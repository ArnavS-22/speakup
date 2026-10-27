create table if not exists bodies (
  id text primary key,
  city text not null,
  level text not null,
  name_en text not null,
  name_es text not null,
  topics text[] not null,
  meeting_pattern text,
  location text,
  time_limit_minutes int default 3,
  how_to_speak_en text,
  how_to_speak_es text,
  accepts_written boolean default false,
  written_instructions text,
  contact_url text,
  verified boolean default false
);

create table if not exists agenda_items (
  id uuid primary key default gen_random_uuid(),
  body_id text references bodies(id),
  meeting_date date not null,
  meeting_time text,
  item_number text,
  title text not null,
  summary_en text,
  summary_es text,
  topics text[] not null,
  source_url text,
  is_demo boolean default true
);

alter table bodies enable row level security;
alter table agenda_items enable row level security;

create policy "Public read bodies"
  on bodies for select
  to anon
  using (true);

create policy "Public read agenda_items"
  on agenda_items for select
  to anon
  using (true);
