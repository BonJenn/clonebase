-- Allow public reads on tenant_data.
--
-- Tenant apps are public websites — their data (menus, posts, products, etc.)
-- must be readable by anyone visiting the URL, not just the owner. The old
-- policy restricted SELECT to owner_id = auth.uid(), which blocked all
-- unauthenticated visitors and non-owner users from seeing any app data.
--
-- Write policies (INSERT/UPDATE/DELETE) remain owner-only. If apps need
-- private data, they gate access at the application level via useTenantAuth.

DROP POLICY IF EXISTS "tenant_data_select" ON public.tenant_data;

CREATE POLICY "tenant_data_select_public" ON public.tenant_data
  FOR SELECT USING (true);
