-- Version pinning for app instances.
-- Every clone (and the creator's own deployment) pins to a specific version of
-- generated_templates, so changes to the template don't automatically propagate.
--
-- template_version: the version the instance is currently running. The runtime
--   loader (loadGeneratedCode) uses this to fetch the right row from
--   generated_templates, rather than blindly taking is_current.
--
-- original_clone_version: the version the instance started on. Used as the
--   floor when showing version history — owners can upgrade to newer versions
--   or revert back to anything they've seen, but never to versions that
--   existed before they cloned (which may have been a completely different
--   app).

alter table public.app_instances
  add column if not exists template_version integer,
  add column if not exists original_clone_version integer;

create index if not exists idx_app_instances_version
  on public.app_instances(template_id, template_version);
