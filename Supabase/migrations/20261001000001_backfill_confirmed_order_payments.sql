UPDATE public.payments p
SET
  status = 'verified',
  paid_at = COALESCE(p.paid_at, o.updated_at, o.created_at)
FROM public.orders o
WHERE p.order_id = o.id
  AND o.status = 'confirmed'
  AND p.status IS DISTINCT FROM 'verified';

INSERT INTO public.payments (
  order_id,
  amount,
  payment_method,
  slip_url,
  status,
  paid_at
)
SELECT
  o.id,
  o.total_amount,
  COALESCE(o.payment_method, CASE WHEN o.payment_slip_url IS NOT NULL THEN 'โอนเงิน' ELSE 'legacy' END),
  o.payment_slip_url,
  'verified',
  COALESCE(o.updated_at, o.created_at)
FROM public.orders o
WHERE o.status = 'confirmed'
  AND NOT EXISTS (
    SELECT 1
    FROM public.payments p
    WHERE p.order_id = o.id
  );
