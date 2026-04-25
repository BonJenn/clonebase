-- Restore tenant_data privacy.
--
-- Public tenant apps now read/write through /api/tenant-data, where the server
-- can enforce password-unlock cookies and tenant/app ownership before using the
-- service role. Direct Supabase anon reads should not expose tenant data.

DROP POLICY IF EXISTS "tenant_data_select_public" ON public.tenant_data;
DROP POLICY IF EXISTS "tenant_data_select" ON public.tenant_data;

CREATE POLICY "tenant_data_select" ON public.tenant_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.tenants
      WHERE tenants.id = tenant_data.tenant_id
        AND tenants.owner_id = auth.uid()
    )
  );
