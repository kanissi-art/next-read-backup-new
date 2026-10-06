CREATE OR REPLACE FUNCTION public.report_sales_by_time()
RETURNS TABLE(month text, total_sales numeric, order_count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_char(o.created_at, 'YYYY-MM')::text,
    sum(o.total_amount)::numeric,
    count(o.id)::bigint
  FROM public.orders o
  JOIN public.payments p ON p.order_id = o.id
  WHERE o.status = 'confirmed'
    AND p.status = 'verified'
  GROUP BY to_char(o.created_at, 'YYYY-MM')
  ORDER BY 1 DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.report_sales_by_category()
RETURNS TABLE(category_name text, total_sales numeric, item_count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.name::text,
    sum(oi.subtotal)::numeric,
    sum(oi.quantity)::bigint
  FROM public.order_items oi
  JOIN public.ebooks e ON e.id = oi.ebook_id
  JOIN public.categories c ON c.id = e.category_id
  JOIN public.orders o ON o.id = oi.order_id
  JOIN public.payments p ON p.order_id = o.id
  WHERE o.status = 'confirmed'
    AND p.status = 'verified'
  GROUP BY c.name
  ORDER BY 2 DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.report_best_selling_ebooks()
RETURNS TABLE(ebook_id integer, title text, total_sold bigint, total_revenue numeric)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.title::text,
    sum(oi.quantity)::bigint,
    sum(oi.subtotal)::numeric
  FROM public.order_items oi
  JOIN public.ebooks e ON e.id = oi.ebook_id
  JOIN public.orders o ON o.id = oi.order_id
  JOIN public.payments p ON p.order_id = o.id
  WHERE o.status = 'confirmed'
    AND p.status = 'verified'
  GROUP BY e.id, e.title
  ORDER BY 3 DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.report_customer_analysis()
RETURNS TABLE(user_id integer, user_name text, total_orders bigint, total_spent numeric)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.name::text,
    count(o.id)::bigint,
    sum(o.total_amount)::numeric
  FROM public.users u
  JOIN public.orders o ON o.user_id = u.id
  JOIN public.payments p ON p.order_id = o.id
  WHERE o.status = 'confirmed'
    AND p.status = 'verified'
  GROUP BY u.id, u.name
  ORDER BY 4 DESC;
END;
$$;

CREATE OR REPLACE VIEW public.report_sales_by_time AS
SELECT
  date_trunc('month', o.created_at) AS month,
  count(DISTINCT o.id) AS total_orders,
  sum(o.total_amount) AS total_sales,
  avg(o.total_amount) AS avg_order_value
FROM public.orders o
JOIN public.payments p ON p.order_id = o.id
WHERE o.status = 'confirmed'
  AND p.status = 'verified'
GROUP BY date_trunc('month', o.created_at)
ORDER BY date_trunc('month', o.created_at);

CREATE OR REPLACE VIEW public.report_sales_by_category AS
SELECT
  c.id AS category_id,
  c.name AS category_name,
  count(DISTINCT oi.ebook_id) AS unique_ebooks_sold,
  coalesce(sum(oi.quantity), 0::bigint) AS total_items_sold,
  coalesce(sum(oi.subtotal), 0::numeric) AS total_revenue
FROM public.categories c
LEFT JOIN public.ebooks e ON e.category_id = c.id
LEFT JOIN public.order_items oi
  ON oi.ebook_id = e.id
  AND EXISTS (
    SELECT 1
    FROM public.orders o
    JOIN public.payments p ON p.order_id = o.id
    WHERE o.id = oi.order_id
      AND o.status = 'confirmed'
      AND p.status = 'verified'
  )
GROUP BY c.id, c.name
ORDER BY sum(oi.subtotal) DESC;

CREATE OR REPLACE VIEW public.report_best_selling_ebooks AS
SELECT
  e.id AS ebook_id,
  e.title,
  a.name AS author_name,
  c.name AS category_name,
  sum(oi.quantity) AS total_sold,
  sum(oi.subtotal) AS total_revenue
FROM public.order_items oi
JOIN public.ebooks e ON e.id = oi.ebook_id
JOIN public.authors a ON a.id = e.author_id
JOIN public.categories c ON c.id = e.category_id
JOIN public.orders o ON o.id = oi.order_id
JOIN public.payments p ON p.order_id = o.id
WHERE o.status = 'confirmed'
  AND p.status = 'verified'
GROUP BY e.id, e.title, a.name, c.name
ORDER BY sum(oi.quantity) DESC
LIMIT 10;

CREATE OR REPLACE VIEW public.report_customer_analysis AS
SELECT
  u.id AS user_id,
  u.name,
  u.email,
  count(DISTINCT o.id) AS total_orders,
  sum(o.total_amount) AS total_spent,
  avg(o.total_amount) AS avg_order_value,
  max(o.created_at) AS last_order_date
FROM public.users u
LEFT JOIN (
  public.orders o
  JOIN public.payments p
    ON p.order_id = o.id
    AND o.status = 'confirmed'
    AND p.status = 'verified'
) ON u.id = o.user_id
WHERE u.role_id = 1
GROUP BY u.id, u.name, u.email
HAVING count(DISTINCT o.id) > 0
ORDER BY sum(o.total_amount) DESC;
