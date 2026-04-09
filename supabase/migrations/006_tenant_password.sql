-- Password-protected tenant apps.
-- When a creator deploys an app to a URL, they can choose to make it public
-- (anyone with the link can visit) or password-protected. The hash + salt are
-- stored on the tenant row; the password gate in the tenant layout checks a
-- signed cookie to determine if the visitor has already unlocked it.

alter table public.tenants
  add column if not exists access_password_hash text,
  add column if not exists access_password_salt text;

-- Index is unnecessary — we only look these up via the tenant's primary key /
-- slug path, which already has indexes from 001_initial_schema.sql.
