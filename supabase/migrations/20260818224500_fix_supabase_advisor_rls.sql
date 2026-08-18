-- ==============================================================================
-- MIGRATION: Fix Supabase Security Advisor RLS on public schema tables
-- Tables: public."Product", public."Consultation", public."Order", public."Subscriber", public."AuditLog"
-- ==============================================================================

-- 1. ENABLE ROW LEVEL SECURITY (RLS) ON ALL FIVE TABLES
ALTER TABLE public."Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Consultation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Subscriber" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AuditLog" ENABLE ROW LEVEL SECURITY;

-- 2. DROP ANY PRE-EXISTING POLICIES ON THESE TABLES (FOR CLEAN REPRODUCIBILITY)
DROP POLICY IF EXISTS "Product_public_read" ON public."Product";
DROP POLICY IF EXISTS "Product_admin_vendor_insert" ON public."Product";
DROP POLICY IF EXISTS "Product_admin_vendor_update" ON public."Product";
DROP POLICY IF EXISTS "Product_admin_vendor_delete" ON public."Product";

DROP POLICY IF EXISTS "Order_customer_or_admin_select" ON public."Order";
DROP POLICY IF EXISTS "Order_customer_or_admin_insert" ON public."Order";
DROP POLICY IF EXISTS "Order_admin_update" ON public."Order";
DROP POLICY IF EXISTS "Order_admin_delete" ON public."Order";

DROP POLICY IF EXISTS "Consultation_owner_or_admin_select" ON public."Consultation";
DROP POLICY IF EXISTS "Consultation_owner_or_admin_insert" ON public."Consultation";
DROP POLICY IF EXISTS "Consultation_admin_update" ON public."Consultation";
DROP POLICY IF EXISTS "Consultation_admin_delete" ON public."Consultation";

DROP POLICY IF EXISTS "Subscriber_admin_only" ON public."Subscriber";
DROP POLICY IF EXISTS "AuditLog_admin_only" ON public."AuditLog";

-- ==============================================================================
-- 3. POLICIES FOR public."Product"
-- Products are publicly readable; only verified vendors and administrators can modify.
-- ==============================================================================

CREATE POLICY "Product_public_read"
  ON public."Product"
  FOR SELECT
  TO anon, authenticated, service_role
  USING (true);

CREATE POLICY "Product_admin_vendor_insert"
  ON public."Product"
  FOR INSERT
  TO authenticated, service_role
  WITH CHECK (
    (auth.jwt() ->> 'role' = 'admin') OR
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() ->> 'role' = 'vendor') OR
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'vendor') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'vendor') OR
    (auth.role() = 'service_role')
  );

CREATE POLICY "Product_admin_vendor_update"
  ON public."Product"
  FOR UPDATE
  TO authenticated, service_role
  USING (
    (auth.jwt() ->> 'role' = 'admin') OR
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() ->> 'role' = 'vendor') OR
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'vendor') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'vendor') OR
    (auth.role() = 'service_role')
  )
  WITH CHECK (
    (auth.jwt() ->> 'role' = 'admin') OR
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() ->> 'role' = 'vendor') OR
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'vendor') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'vendor') OR
    (auth.role() = 'service_role')
  );

CREATE POLICY "Product_admin_vendor_delete"
  ON public."Product"
  FOR DELETE
  TO authenticated, service_role
  USING (
    (auth.jwt() ->> 'role' = 'admin') OR
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() ->> 'role' = 'vendor') OR
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'vendor') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'vendor') OR
    (auth.role() = 'service_role')
  );

-- ==============================================================================
-- 4. POLICIES FOR public."Order"
-- Orders can only be read by the ordering customer, relevant vendor/admin, or service_role.
-- Anonymous users are strictly denied read/write access.
-- ==============================================================================

CREATE POLICY "Order_customer_or_admin_select"
  ON public."Order"
  FOR SELECT
  TO authenticated, service_role
  USING (
    (lower(email) = lower(auth.jwt() ->> 'email')) OR
    (auth.jwt() ->> 'role' = 'admin') OR
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    (auth.role() = 'service_role')
  );

CREATE POLICY "Order_customer_or_admin_insert"
  ON public."Order"
  FOR INSERT
  TO authenticated, service_role
  WITH CHECK (
    (lower(email) = lower(auth.jwt() ->> 'email')) OR
    (auth.jwt() ->> 'role' = 'admin') OR
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    (auth.role() = 'service_role')
  );

CREATE POLICY "Order_admin_update"
  ON public."Order"
  FOR UPDATE
  TO authenticated, service_role
  USING (
    (auth.jwt() ->> 'role' = 'admin') OR
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    (auth.role() = 'service_role')
  )
  WITH CHECK (
    (auth.jwt() ->> 'role' = 'admin') OR
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    (auth.role() = 'service_role')
  );

CREATE POLICY "Order_admin_delete"
  ON public."Order"
  FOR DELETE
  TO authenticated, service_role
  USING (
    (auth.jwt() ->> 'role' = 'admin') OR
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    (auth.role() = 'service_role')
  );

-- ==============================================================================
-- 5. POLICIES FOR public."Consultation"
-- Consultations are strictly accessible to the user who requested them or admins.
-- ==============================================================================

CREATE POLICY "Consultation_owner_or_admin_select"
  ON public."Consultation"
  FOR SELECT
  TO authenticated, service_role
  USING (
    (lower(email) = lower(auth.jwt() ->> 'email')) OR
    (auth.jwt() ->> 'role' = 'admin') OR
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    (auth.role() = 'service_role')
  );

CREATE POLICY "Consultation_owner_or_admin_insert"
  ON public."Consultation"
  FOR INSERT
  TO authenticated, service_role
  WITH CHECK (
    (lower(email) = lower(auth.jwt() ->> 'email')) OR
    (auth.jwt() ->> 'role' = 'admin') OR
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    (auth.role() = 'service_role')
  );

CREATE POLICY "Consultation_admin_update"
  ON public."Consultation"
  FOR UPDATE
  TO authenticated, service_role
  USING (
    (auth.jwt() ->> 'role' = 'admin') OR
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    (auth.role() = 'service_role')
  )
  WITH CHECK (
    (auth.jwt() ->> 'role' = 'admin') OR
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    (auth.role() = 'service_role')
  );

CREATE POLICY "Consultation_admin_delete"
  ON public."Consultation"
  FOR DELETE
  TO authenticated, service_role
  USING (
    (auth.jwt() ->> 'role' = 'admin') OR
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    (auth.role() = 'service_role')
  );

-- ==============================================================================
-- 6. POLICIES FOR public."Subscriber"
-- Subscriber emails are highly protected against unauthorized scraping/harvesting.
-- ==============================================================================

CREATE POLICY "Subscriber_admin_only"
  ON public."Subscriber"
  FOR ALL
  TO authenticated, service_role
  USING (
    (auth.jwt() ->> 'role' = 'admin') OR
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    (auth.role() = 'service_role')
  )
  WITH CHECK (
    (auth.jwt() ->> 'role' = 'admin') OR
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    (auth.role() = 'service_role')
  );

-- ==============================================================================
-- 7. POLICIES FOR public."AuditLog"
-- Audit logs are strictly immutable and restricted to administrators/service_role.
-- ==============================================================================

CREATE POLICY "AuditLog_admin_only"
  ON public."AuditLog"
  FOR ALL
  TO authenticated, service_role
  USING (
    (auth.jwt() ->> 'role' = 'admin') OR
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    (auth.role() = 'service_role')
  )
  WITH CHECK (
    (auth.jwt() ->> 'role' = 'admin') OR
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    (auth.role() = 'service_role')
  );

-- ==============================================================================
-- 8. GRANT LEAST-PRIVILEGE PERMISSIONS ON PUBLIC TABLES
-- ==============================================================================

-- Revoke unnecessary anon write privileges
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public."Product" FROM anon;
REVOKE ALL ON public."Order" FROM anon;
REVOKE ALL ON public."Consultation" FROM anon;
REVOKE ALL ON public."Subscriber" FROM anon;
REVOKE ALL ON public."AuditLog" FROM anon;

-- Grant appropriate permissions to anon, authenticated, and service_role
GRANT SELECT ON public."Product" TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public."Product" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."Order" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."Consultation" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."Subscriber" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."AuditLog" TO authenticated;

GRANT ALL ON public."Product" TO service_role;
GRANT ALL ON public."Order" TO service_role;
GRANT ALL ON public."Consultation" TO service_role;
GRANT ALL ON public."Subscriber" TO service_role;
GRANT ALL ON public."AuditLog" TO service_role;
