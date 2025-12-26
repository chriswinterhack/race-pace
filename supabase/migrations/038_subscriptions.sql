-- FinalClimb Subscription System
-- Stripe integration tables for payment and subscription management

-- ============================================
-- STRIPE CUSTOMER MAPPING
-- ============================================
-- Maps FinalClimb users to Stripe customer IDs
CREATE TABLE public.stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- SUBSCRIPTIONS
-- ============================================
-- Tracks active and historical subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false NOT NULL,
  canceled_at TIMESTAMPTZ,
  is_lifetime BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- PAYMENTS / INVOICE HISTORY
-- ============================================
-- Records successful and failed payment attempts
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_invoice_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd' NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending', 'refunded')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- WEBHOOK EVENT LOG
-- ============================================
-- For debugging and ensuring idempotency of webhook processing
CREATE TABLE public.stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  payload JSONB
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_stripe_customers_user ON public.stripe_customers(user_id);
CREATE INDEX idx_stripe_customers_stripe_id ON public.stripe_customers(stripe_customer_id);

CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);

CREATE INDEX idx_payments_user ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_created ON public.payments(created_at DESC);

CREATE INDEX idx_webhook_events_stripe_id ON public.stripe_webhook_events(stripe_event_id);
CREATE INDEX idx_webhook_events_type ON public.stripe_webhook_events(event_type);

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- STRIPE_CUSTOMERS policies
-- Users can view their own Stripe customer record
CREATE POLICY "Users can view own stripe customer"
  ON public.stripe_customers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all Stripe customers
CREATE POLICY "Admins can view all stripe customers"
  ON public.stripe_customers FOR SELECT
  TO authenticated
  USING (is_admin());

-- Only service role can insert/update (via webhooks)
-- No INSERT/UPDATE/DELETE policies for regular users

-- SUBSCRIPTIONS policies
-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (is_admin());

-- PAYMENTS policies
-- Users can view their own payment history
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (is_admin());

-- WEBHOOK_EVENTS policies
-- Only admins can view webhook logs (for debugging)
CREATE POLICY "Admins can view webhook events"
  ON public.stripe_webhook_events FOR SELECT
  TO authenticated
  USING (is_admin());

-- ============================================
-- HELPER FUNCTION: Check if user has active subscription
-- ============================================
CREATE OR REPLACE FUNCTION has_active_subscription(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has active subscription status in users table
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = check_user_id
    AND subscription_status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Check if user is premium (convenience alias)
-- ============================================
CREATE OR REPLACE FUNCTION is_premium(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN has_active_subscription(check_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.stripe_customers IS 'Maps FinalClimb users to Stripe customer IDs';
COMMENT ON TABLE public.subscriptions IS 'Subscription records synced from Stripe';
COMMENT ON TABLE public.payments IS 'Payment and invoice history from Stripe';
COMMENT ON TABLE public.stripe_webhook_events IS 'Log of processed Stripe webhook events for idempotency';

COMMENT ON FUNCTION has_active_subscription IS 'Check if a user has an active premium subscription';
COMMENT ON FUNCTION is_premium IS 'Convenience alias for has_active_subscription';
