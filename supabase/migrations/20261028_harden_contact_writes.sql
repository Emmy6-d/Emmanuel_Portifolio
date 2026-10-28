-- Apply in Supabase SQL Editor after the original schema.
-- Contact submissions are written by FastAPI with the service-role key; the
-- browser does not need direct database insert access.
drop policy if exists "anyone can submit contacts" on public.contacts;
revoke insert on public.contacts from anon, authenticated;
revoke usage, select on sequence public.contacts_id_seq from anon, authenticated;

create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profile_updated_at on public.profile;
create trigger profile_updated_at
before update on public.profile
for each row execute function public.set_profile_updated_at();

-- Keep public content ordering deterministic for the API.
create index if not exists experiences_sort_order_idx on public.experiences (sort_order, id);
create index if not exists projects_sort_order_idx on public.projects (sort_order, id);
create index if not exists education_sort_order_idx on public.education (sort_order, id);
create index if not exists skills_sort_order_idx on public.skills (sort_order, id);
create index if not exists certifications_sort_order_idx on public.certifications (sort_order, id);
create index if not exists languages_sort_order_idx on public.languages (sort_order, id);
