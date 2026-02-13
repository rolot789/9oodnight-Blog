-- Create the todos table
create table if not exists todos (
  id uuid default gen_random_uuid() primary key,
  text text not null,
  category text not null,
  status text not null default 'Draft',
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users default auth.uid()
);

-- Enable Row Level Security
alter table todos enable row level security;

-- Create a policy that allows users to perform all actions on their own todos
create policy "Users can manage their own todos"
on todos for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Link todos to posts (optional feature)
create table if not exists todo_post_links (
  todo_id uuid primary key references todos(id) on delete cascade,
  post_id uuid not null references posts(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table todo_post_links enable row level security;

drop policy if exists "Users can view todo links for their todos" on todo_post_links;
create policy "Users can view todo links for their todos"
on todo_post_links for select
using (
  exists (
    select 1 from todos
    where todos.id = todo_post_links.todo_id
      and todos.user_id = auth.uid()
  )
);

drop policy if exists "Users can manage todo links for their todos" on todo_post_links;
create policy "Users can manage todo links for their todos"
on todo_post_links for all
using (
  exists (
    select 1 from todos
    where todos.id = todo_post_links.todo_id
      and todos.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from todos
    where todos.id = todo_post_links.todo_id
      and todos.user_id = auth.uid()
  )
);

-- Series metadata per post
create table if not exists post_series_items (
  post_id uuid primary key references posts(id) on delete cascade,
  series_slug text not null,
  series_title text not null,
  position integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists post_series_items_slug_idx on post_series_items(series_slug);
create index if not exists post_series_items_position_idx on post_series_items(series_slug, position);

alter table post_series_items enable row level security;

drop policy if exists "Anyone can read series metadata" on post_series_items;
create policy "Anyone can read series metadata"
on post_series_items for select
using (true);

drop policy if exists "Authenticated users can manage series metadata" on post_series_items;
create policy "Authenticated users can manage series metadata"
on post_series_items for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
