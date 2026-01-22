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
