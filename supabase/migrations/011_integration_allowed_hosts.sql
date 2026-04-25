-- External integration proxy allowlists.
--
-- The proxy must not attach decrypted tenant secrets to arbitrary caller
-- supplied URLs. Each integration definition declares the hostnames that its
-- stored secrets may be sent to.

ALTER TABLE public.integration_definitions
  ADD COLUMN IF NOT EXISTS allowed_hosts text[] NOT NULL DEFAULT '{}';
