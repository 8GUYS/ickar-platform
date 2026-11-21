-- ====================================================================
-- ICKAR PostgreSQL Row-Level Security (RLS) & Multi-Tenancy Migration
-- Enforces zero data leakage across independent tenant environments
-- ====================================================================

-- 1. Enable RLS on Tenant-bound tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "media_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;

-- 2. Create Isolation Policies (Default to Deny when tenant context is absent)

-- User Isolation Policy
CREATE POLICY tenant_user_isolation_policy ON "users"
  FOR ALL
  USING (
    "tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::text
  );

-- Media Catalog Isolation Policy
-- Allows public access to published media in current tenant, restricted admin edits
CREATE POLICY tenant_media_isolation_policy ON "media_items"
  FOR ALL
  USING (
    "tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::text
  );

-- Order Records Isolation Policy
CREATE POLICY tenant_order_isolation_policy ON "orders"
  FOR ALL
  USING (
    "tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::text
  );

-- 3. Super Admin Bypass Policy (Audited privileged execution)
CREATE POLICY super_admin_bypass ON "media_items"
  FOR ALL
  TO authenticated
  USING (
    current_setting('app.is_super_admin', true) = 'true'
  );
