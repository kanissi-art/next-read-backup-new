


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."add_to_cart"("p_user_id" integer, "p_ebook_id" integer, "p_quantity" integer DEFAULT 1) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_cart_id INTEGER;
    v_price DECIMAL(10,2);
BEGIN
    -- Get or create cart
    SELECT id INTO v_cart_id FROM carts WHERE user_id = p_user_id AND status = 'active';
    
    IF v_cart_id IS NULL THEN
        INSERT INTO carts (user_id, status) VALUES (p_user_id, 'active') RETURNING id INTO v_cart_id;
    END IF;
    
    -- Get ebook price
    SELECT price INTO v_price FROM ebooks WHERE id = p_ebook_id AND is_active = TRUE;
    
    IF v_price IS NULL THEN
        RAISE EXCEPTION 'Ebook not found or not active';
    END IF;
    
    -- Check if item already in cart
    IF EXISTS (SELECT 1 FROM cart_items WHERE cart_id = v_cart_id AND ebook_id = p_ebook_id) THEN
        UPDATE cart_items 
        SET quantity = quantity + p_quantity, added_at = CURRENT_TIMESTAMP
        WHERE cart_id = v_cart_id AND ebook_id = p_ebook_id;
    ELSE
        INSERT INTO cart_items (cart_id, ebook_id, quantity, price)
        VALUES (v_cart_id, p_ebook_id, p_quantity, v_price);
    END IF;
END;
$$;


ALTER FUNCTION "public"."add_to_cart"("p_user_id" integer, "p_ebook_id" integer, "p_quantity" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."confirm_order"("p_order_id" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_order_item RECORD;
    v_token VARCHAR;
BEGIN
    -- Update order status
    UPDATE orders 
    SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP 
    WHERE id = p_order_id;
    
    -- Update payment status
    UPDATE payments 
    SET status = 'verified', paid_at = CURRENT_TIMESTAMP 
    WHERE order_id = p_order_id;
    
    -- Generate download links for each order item
    FOR v_order_item IN 
        SELECT oi.id, e.download_url 
        FROM order_items oi
        JOIN ebooks e ON oi.ebook_id = e.id
        WHERE oi.order_id = p_order_id
    LOOP
        v_token := 'token_' || MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT);
        
        INSERT INTO download_links (order_item_id, token, expires_at)
        VALUES (v_order_item.id, v_token, CURRENT_TIMESTAMP + INTERVAL '7 days');
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."confirm_order"("p_order_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_order_from_cart"("p_user_id" integer, "p_payment_method" character varying, "p_slip_url" character varying) RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_cart_id INTEGER;
    v_order_id INTEGER;
    v_total_amount DECIMAL(10,2);
BEGIN
    -- Get active cart
    SELECT id INTO v_cart_id FROM carts WHERE user_id = p_user_id AND status = 'active';
    
    IF v_cart_id IS NULL THEN
        RAISE EXCEPTION 'No active cart found for user %', p_user_id;
    END IF;
    
    -- Calculate total
    SELECT COALESCE(SUM(price * quantity), 0) INTO v_total_amount
    FROM cart_items WHERE cart_id = v_cart_id;
    
    IF v_total_amount = 0 THEN
        RAISE EXCEPTION 'Cart is empty';
    END IF;
    
    -- Create order
    INSERT INTO orders (user_id, total_amount, status, payment_slip_url)
    VALUES (p_user_id, v_total_amount, 'pending', p_slip_url)
    RETURNING id INTO v_order_id;
    
    -- Copy cart items to order items
    INSERT INTO order_items (order_id, ebook_id, quantity, price, subtotal)
    SELECT v_order_id, ebook_id, quantity, price, price * quantity
    FROM cart_items WHERE cart_id = v_cart_id;
    
    -- Create payment record
    INSERT INTO payments (order_id, amount, payment_method, slip_url, status)
    VALUES (v_order_id, v_total_amount, p_payment_method, p_slip_url, 'pending');
    
    -- Update cart status
    UPDATE carts SET status = 'converted', updated_at = CURRENT_TIMESTAMP WHERE id = v_cart_id;
    
    -- Clear cart items
    DELETE FROM cart_items WHERE cart_id = v_cart_id;
    
    RETURN v_order_id;
END;
$$;


ALTER FUNCTION "public"."create_order_from_cart"("p_user_id" integer, "p_payment_method" character varying, "p_slip_url" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."report_best_selling_ebooks"() RETURNS TABLE("ebook_id" integer, "title" "text", "total_sold" bigint, "total_revenue" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.title::text, SUM(oi.quantity)::bigint, SUM(oi.subtotal)::numeric
  FROM order_items oi
  JOIN ebooks e ON oi.ebook_id = e.id
  JOIN orders o ON oi.order_id = o.id
    JOIN payments p ON p.order_id = o.id
    WHERE o.status = 'confirmed' AND p.status = 'verified'
  GROUP BY e.id, e.title
  ORDER BY total_sold DESC;
END; $$;


ALTER FUNCTION "public"."report_best_selling_ebooks"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."report_customer_analysis"() RETURNS TABLE("user_id" integer, "user_name" "text", "total_orders" bigint, "total_spent" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name::text, COUNT(o.id)::bigint, SUM(o.total_amount)::numeric
  FROM users u
  JOIN orders o ON u.id = o.user_id
    JOIN payments p ON p.order_id = o.id
    WHERE o.status = 'confirmed' AND p.status = 'verified'
  GROUP BY u.id, u.name
  ORDER BY total_spent DESC;
END; $$;


ALTER FUNCTION "public"."report_customer_analysis"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."report_sales_by_category"() RETURNS TABLE("category_name" "text", "total_sales" numeric, "item_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT c.name::text, SUM(oi.subtotal)::numeric, SUM(oi.quantity)::bigint
  FROM order_items oi
  JOIN ebooks e ON oi.ebook_id = e.id
  JOIN categories c ON e.category_id = c.id
  JOIN orders o ON oi.order_id = o.id
    JOIN payments p ON p.order_id = o.id
    WHERE o.status = 'confirmed' AND p.status = 'verified'
  GROUP BY c.name
  ORDER BY total_sales DESC;
END; $$;


ALTER FUNCTION "public"."report_sales_by_category"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."report_sales_by_time"() RETURNS TABLE("month" "text", "total_sales" numeric, "order_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT TO_CHAR(o.created_at, 'YYYY-MM')::text, SUM(o.total_amount)::numeric, COUNT(o.id)::bigint
    FROM orders o
    JOIN payments p ON p.order_id = o.id
    WHERE o.status = 'confirmed' AND p.status = 'verified'
    GROUP BY TO_CHAR(o.created_at, 'YYYY-MM')
  ORDER BY month DESC;
END; $$;


ALTER FUNCTION "public"."report_sales_by_time"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."authors" (
    "id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "bio" "text",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."authors" OWNER TO "postgres";


COMMENT ON TABLE "public"."authors" IS 'ผู้แต่งหนังสือ';



CREATE SEQUENCE IF NOT EXISTS "public"."authors_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."authors_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."authors_id_seq" OWNED BY "public"."authors"."id";



CREATE TABLE IF NOT EXISTS "public"."cart_items" (
    "id" integer NOT NULL,
    "cart_id" integer NOT NULL,
    "ebook_id" integer NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "added_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cart_items_price_check" CHECK (("price" > (0)::numeric)),
    CONSTRAINT "cart_items_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."cart_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."cart_items" IS 'รายการในตะกร้า';



COMMENT ON COLUMN "public"."cart_items"."price" IS 'ราคา ณ เวลาเพิ่มลงตะกร้า';



CREATE SEQUENCE IF NOT EXISTS "public"."cart_items_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."cart_items_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."cart_items_id_seq" OWNED BY "public"."cart_items"."id";



CREATE TABLE IF NOT EXISTS "public"."carts" (
    "id" integer NOT NULL,
    "user_id" integer NOT NULL,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "carts_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'converted'::character varying, 'abandoned'::character varying])::"text"[])))
);


ALTER TABLE "public"."carts" OWNER TO "postgres";


COMMENT ON TABLE "public"."carts" IS 'ตะกร้าสินค้าของผู้ใช้';



COMMENT ON COLUMN "public"."carts"."status" IS 'active=ใช้งาน, converted=สั่งซื้อแล้ว, abandoned=ทิ้งไว้';



CREATE SEQUENCE IF NOT EXISTS "public"."carts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."carts_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."carts_id_seq" OWNED BY "public"."carts"."id";



CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


COMMENT ON TABLE "public"."categories" IS 'หมวดหมู่หนังสือ';



CREATE SEQUENCE IF NOT EXISTS "public"."categories_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."categories_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."categories_id_seq" OWNED BY "public"."categories"."id";



CREATE TABLE IF NOT EXISTS "public"."download_links" (
    "id" integer NOT NULL,
    "order_item_id" integer NOT NULL,
    "token" character varying(255) NOT NULL,
    "expires_at" timestamp without time zone NOT NULL,
    "downloaded_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."download_links" OWNER TO "postgres";


COMMENT ON TABLE "public"."download_links" IS 'ลิงก์ดาวน์โหลดหนังสือ';



COMMENT ON COLUMN "public"."download_links"."token" IS 'Token สำหรับเข้าถึงลิงก์';



COMMENT ON COLUMN "public"."download_links"."expires_at" IS 'วันหมดอายุของลิงก์';



CREATE SEQUENCE IF NOT EXISTS "public"."download_links_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."download_links_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."download_links_id_seq" OWNED BY "public"."download_links"."id";



CREATE TABLE IF NOT EXISTS "public"."ebooks" (
    "id" integer NOT NULL,
    "category_id" integer NOT NULL,
    "author_id" integer NOT NULL,
    "title" character varying(200) NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "cover_url" character varying(500),
    "download_url" character varying(500),
    "stock" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ebooks_price_check" CHECK (("price" > (0)::numeric)),
    CONSTRAINT "ebooks_stock_check" CHECK (("stock" >= 0))
);


ALTER TABLE "public"."ebooks" OWNER TO "postgres";


COMMENT ON TABLE "public"."ebooks" IS 'รายการหนังสืออิเล็กทรอนิกส์';



COMMENT ON COLUMN "public"."ebooks"."price" IS 'ราคาหนังสือ (ต้องมากกว่า 0)';



COMMENT ON COLUMN "public"."ebooks"."stock" IS 'จำนวนคงเหลือ (ต้องไม่เป็นลบ)';



COMMENT ON COLUMN "public"."ebooks"."is_active" IS 'สถานะพร้อมขาย';



CREATE SEQUENCE IF NOT EXISTS "public"."ebooks_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."ebooks_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ebooks_id_seq" OWNED BY "public"."ebooks"."id";



CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" integer NOT NULL,
    "order_id" integer NOT NULL,
    "ebook_id" integer NOT NULL,
    "quantity" integer NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "subtotal" numeric(10,2) NOT NULL,
    CONSTRAINT "order_items_price_check" CHECK (("price" > (0)::numeric)),
    CONSTRAINT "order_items_quantity_check" CHECK (("quantity" > 0)),
    CONSTRAINT "order_items_subtotal_check" CHECK (("subtotal" > (0)::numeric))
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."order_items" IS 'รายการในคำสั่งซื้อ';



COMMENT ON COLUMN "public"."order_items"."price" IS 'ราคา ณ เวลาสั่งซื้อ';



COMMENT ON COLUMN "public"."order_items"."subtotal" IS 'price × quantity';



CREATE SEQUENCE IF NOT EXISTS "public"."order_items_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."order_items_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."order_items_id_seq" OWNED BY "public"."order_items"."id";



CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" integer NOT NULL,
    "user_id" integer NOT NULL,
    "total_amount" numeric(10,2) NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "payment_slip_url" character varying(500),
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "payment_method" "text",
    CONSTRAINT "orders_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'confirmed'::character varying, 'cancelled'::character varying])::"text"[]))),
    CONSTRAINT "orders_total_amount_check" CHECK (("total_amount" > (0)::numeric))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


COMMENT ON TABLE "public"."orders" IS 'คำสั่งซื้อ';



COMMENT ON COLUMN "public"."orders"."status" IS 'pending=รอชำระ, paid=ชำระแล้ว, confirmed=ยืนยันแล้ว, cancelled=ยกเลิก';



CREATE SEQUENCE IF NOT EXISTS "public"."orders_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."orders_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."orders_id_seq" OWNED BY "public"."orders"."id";



CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" integer NOT NULL,
    "order_id" integer NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "payment_method" character varying(50) NOT NULL,
    "slip_url" character varying(500),
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "paid_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "payments_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'verified'::character varying, 'rejected'::character varying])::"text"[])))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


COMMENT ON TABLE "public"."payments" IS 'การชำระเงิน';



COMMENT ON COLUMN "public"."payments"."order_id" IS '1 คำสั่ง = 1 การชำระ (UNIQUE)';



COMMENT ON COLUMN "public"."payments"."status" IS 'pending=รอตรวจสอบ, verified=ยืนยันแล้ว, rejected=ปฏิเสธ';



CREATE SEQUENCE IF NOT EXISTS "public"."payments_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."payments_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."payments_id_seq" OWNED BY "public"."payments"."id";



CREATE OR REPLACE VIEW "public"."report_best_selling_ebooks" AS
 SELECT "e"."id" AS "ebook_id",
    "e"."title",
    "a"."name" AS "author_name",
    "c"."name" AS "category_name",
    "sum"("oi"."quantity") AS "total_sold",
    "sum"("oi"."subtotal") AS "total_revenue"
   FROM (((("public"."order_items" "oi"
     JOIN "public"."ebooks" "e" ON (("oi"."ebook_id" = "e"."id")))
     JOIN "public"."authors" "a" ON (("e"."author_id" = "a"."id")))
     JOIN "public"."categories" "c" ON (("e"."category_id" = "c"."id")))
        JOIN "public"."orders" "o" ON (("oi"."order_id" = "o"."id"))
        JOIN "public"."payments" "p" ON (("p"."order_id" = "o"."id")))
  WHERE (("o"."status")::"text" = 'confirmed'::"text") AND (("p"."status")::"text" = 'verified'::"text")
  GROUP BY "e"."id", "e"."title", "a"."name", "c"."name"
  ORDER BY ("sum"("oi"."quantity")) DESC
 LIMIT 10;


ALTER VIEW "public"."report_best_selling_ebooks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" integer NOT NULL,
    "role_id" integer NOT NULL,
    "email" character varying(100) NOT NULL,
    "password_hash" character varying(255) NOT NULL,
    "name" character varying(100) NOT NULL,
    "phone" character varying(20),
    "address" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON TABLE "public"."users" IS 'ข้อมูลผู้ใช้งานระบบ';



COMMENT ON COLUMN "public"."users"."email" IS 'อีเมลสำหรับ login';



COMMENT ON COLUMN "public"."users"."password_hash" IS 'รหัสผ่านที่ hash แล้ว (bcrypt)';



CREATE OR REPLACE VIEW "public"."report_customer_analysis" AS
 SELECT "u"."id" AS "user_id",
    "u"."name",
    "u"."email",
    "count"(DISTINCT "o"."id") AS "total_orders",
    "sum"("o"."total_amount") AS "total_spent",
    "avg"("o"."total_amount") AS "avg_order_value",
    "max"("o"."created_at") AS "last_order_date"
     FROM ("public"."users" "u"
         LEFT JOIN ("public"."orders" "o"
             JOIN "public"."payments" "p" ON ((("p"."order_id" = "o"."id") AND (("o"."status")::"text" = 'confirmed'::"text") AND (("p"."status")::"text" = 'verified'::"text")))) ON (("u"."id" = "o"."user_id")))
  WHERE ("u"."role_id" = 1)
  GROUP BY "u"."id", "u"."name", "u"."email"
 HAVING ("count"(DISTINCT "o"."id") > 0)
  ORDER BY ("sum"("o"."total_amount")) DESC;


ALTER VIEW "public"."report_customer_analysis" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."report_order_status_summary" AS
 SELECT "status",
    "count"(*) AS "order_count",
    "sum"("total_amount") AS "total_amount"
   FROM "public"."orders"
  GROUP BY "status"
  ORDER BY ("count"(*)) DESC;


ALTER VIEW "public"."report_order_status_summary" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."report_sales_by_category" AS
 SELECT "c"."id" AS "category_id",
    "c"."name" AS "category_name",
    "count"(DISTINCT "oi"."ebook_id") AS "unique_ebooks_sold",
    COALESCE("sum"("oi"."quantity"), 0::bigint) AS "total_items_sold",
    COALESCE("sum"("oi"."subtotal"), 0::numeric) AS "total_revenue"
     FROM (("public"."categories" "c"
         LEFT JOIN "public"."ebooks" "e" ON (("c"."id" = "e"."category_id")))
         LEFT JOIN ("public"."order_items" "oi"
             JOIN "public"."orders" "o" ON (("oi"."order_id" = "o"."id"))
             JOIN "public"."payments" "p" ON ((("p"."order_id" = "o"."id") AND (("o"."status")::"text" = 'confirmed'::"text") AND (("p"."status")::"text" = 'verified'::"text")))) ON (("e"."id" = "oi"."ebook_id")))
  GROUP BY "c"."id", "c"."name"
  ORDER BY ("sum"("oi"."subtotal")) DESC;


ALTER VIEW "public"."report_sales_by_category" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."report_sales_by_time" AS
 SELECT "date_trunc"('month'::"text", "o"."created_at") AS "month",
    "count"(DISTINCT "o"."id") AS "total_orders",
    "sum"("o"."total_amount") AS "total_sales",
    "avg"("o"."total_amount") AS "avg_order_value"
     FROM ("public"."orders" "o"
         JOIN "public"."payments" "p" ON ((("p"."order_id" = "o"."id") AND (("o"."status")::"text" = 'confirmed'::"text") AND (("p"."status")::"text" = 'verified'::"text"))))
    GROUP BY ("date_trunc"('month'::"text", "o"."created_at"))
    ORDER BY ("date_trunc"('month'::"text", "o"."created_at"));


ALTER VIEW "public"."report_sales_by_time" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" integer NOT NULL,
    "user_id" integer NOT NULL,
    "ebook_id" integer NOT NULL,
    "rating" integer NOT NULL,
    "comment" "text",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


COMMENT ON TABLE "public"."reviews" IS 'รีวิวและให้คะแนนหนังสือ';



COMMENT ON COLUMN "public"."reviews"."rating" IS 'คะแนน 1-5 ดาว';



CREATE SEQUENCE IF NOT EXISTS "public"."reviews_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."reviews_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."reviews_id_seq" OWNED BY "public"."reviews"."id";



CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" integer NOT NULL,
    "name" character varying(50) NOT NULL,
    "description" "text",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


COMMENT ON TABLE "public"."roles" IS 'บทบาทผู้ใช้งาน (customer, admin)';



COMMENT ON COLUMN "public"."roles"."name" IS 'ชื่อบทบาท: customer หรือ admin';



CREATE SEQUENCE IF NOT EXISTS "public"."roles_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."roles_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."roles_id_seq" OWNED BY "public"."roles"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."users_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."users_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."users_id_seq" OWNED BY "public"."users"."id";



CREATE TABLE IF NOT EXISTS "public"."wishlists" (
    "id" integer NOT NULL,
    "user_id" integer NOT NULL,
    "ebook_id" integer NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."wishlists" OWNER TO "postgres";


COMMENT ON TABLE "public"."wishlists" IS 'รายการที่อยากได้';



CREATE SEQUENCE IF NOT EXISTS "public"."wishlists_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."wishlists_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."wishlists_id_seq" OWNED BY "public"."wishlists"."id";



ALTER TABLE ONLY "public"."authors" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."authors_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."cart_items" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."cart_items_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."carts" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."carts_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."categories" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."categories_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."download_links" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."download_links_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ebooks" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."ebooks_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."order_items" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."order_items_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."orders" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."orders_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."payments" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."payments_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."reviews" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."reviews_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."roles" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."roles_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."users" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."users_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."wishlists" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."wishlists_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."authors"
    ADD CONSTRAINT "authors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."carts"
    ADD CONSTRAINT "carts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."download_links"
    ADD CONSTRAINT "download_links_order_item_id_key" UNIQUE ("order_item_id");



ALTER TABLE ONLY "public"."download_links"
    ADD CONSTRAINT "download_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."download_links"
    ADD CONSTRAINT "download_links_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."ebooks"
    ADD CONSTRAINT "ebooks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_order_id_key" UNIQUE ("order_id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_user_id_ebook_id_key" UNIQUE ("user_id", "ebook_id");



COMMENT ON CONSTRAINT "reviews_user_id_ebook_id_key" ON "public"."reviews" IS '1 คน รีวิว 1 หนังสือได้ครั้งเดียว';



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wishlists"
    ADD CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wishlists"
    ADD CONSTRAINT "wishlists_user_id_ebook_id_key" UNIQUE ("user_id", "ebook_id");



COMMENT ON CONSTRAINT "wishlists_user_id_ebook_id_key" ON "public"."wishlists" IS 'ไม่ให้มีรายการซ้ำ';



CREATE INDEX "idx_cart_items_cart_id" ON "public"."cart_items" USING "btree" ("cart_id");



CREATE INDEX "idx_cart_items_ebook_id" ON "public"."cart_items" USING "btree" ("ebook_id");



CREATE INDEX "idx_carts_status" ON "public"."carts" USING "btree" ("status");



CREATE INDEX "idx_carts_user_id" ON "public"."carts" USING "btree" ("user_id");



CREATE INDEX "idx_download_links_order_item_id" ON "public"."download_links" USING "btree" ("order_item_id");



CREATE INDEX "idx_download_links_token" ON "public"."download_links" USING "btree" ("token");



CREATE INDEX "idx_ebooks_author_id" ON "public"."ebooks" USING "btree" ("author_id");



CREATE INDEX "idx_ebooks_category_id" ON "public"."ebooks" USING "btree" ("category_id");



CREATE INDEX "idx_ebooks_is_active" ON "public"."ebooks" USING "btree" ("is_active");



CREATE INDEX "idx_ebooks_title" ON "public"."ebooks" USING "btree" ("title");



CREATE INDEX "idx_order_items_ebook_id" ON "public"."order_items" USING "btree" ("ebook_id");



CREATE INDEX "idx_order_items_order_id" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "idx_orders_created_at" ON "public"."orders" USING "btree" ("created_at");



CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");



CREATE INDEX "idx_orders_user_id" ON "public"."orders" USING "btree" ("user_id");



CREATE INDEX "idx_payments_order_id" ON "public"."payments" USING "btree" ("order_id");



CREATE INDEX "idx_payments_status" ON "public"."payments" USING "btree" ("status");



CREATE INDEX "idx_reviews_ebook_id" ON "public"."reviews" USING "btree" ("ebook_id");



CREATE INDEX "idx_reviews_rating" ON "public"."reviews" USING "btree" ("rating");



CREATE INDEX "idx_reviews_user_id" ON "public"."reviews" USING "btree" ("user_id");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_role_id" ON "public"."users" USING "btree" ("role_id");



CREATE INDEX "idx_wishlists_ebook_id" ON "public"."wishlists" USING "btree" ("ebook_id");



CREATE INDEX "idx_wishlists_user_id" ON "public"."wishlists" USING "btree" ("user_id");



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_ebook_id_fkey" FOREIGN KEY ("ebook_id") REFERENCES "public"."ebooks"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."carts"
    ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."download_links"
    ADD CONSTRAINT "download_links_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ebooks"
    ADD CONSTRAINT "ebooks_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ebooks"
    ADD CONSTRAINT "ebooks_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_ebook_id_fkey" FOREIGN KEY ("ebook_id") REFERENCES "public"."ebooks"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_ebook_id_fkey" FOREIGN KEY ("ebook_id") REFERENCES "public"."ebooks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."wishlists"
    ADD CONSTRAINT "wishlists_ebook_id_fkey" FOREIGN KEY ("ebook_id") REFERENCES "public"."ebooks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wishlists"
    ADD CONSTRAINT "wishlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."add_to_cart"("p_user_id" integer, "p_ebook_id" integer, "p_quantity" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."add_to_cart"("p_user_id" integer, "p_ebook_id" integer, "p_quantity" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_to_cart"("p_user_id" integer, "p_ebook_id" integer, "p_quantity" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."confirm_order"("p_order_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."confirm_order"("p_order_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."confirm_order"("p_order_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_order_from_cart"("p_user_id" integer, "p_payment_method" character varying, "p_slip_url" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."create_order_from_cart"("p_user_id" integer, "p_payment_method" character varying, "p_slip_url" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_order_from_cart"("p_user_id" integer, "p_payment_method" character varying, "p_slip_url" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."report_best_selling_ebooks"() TO "anon";
GRANT ALL ON FUNCTION "public"."report_best_selling_ebooks"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."report_best_selling_ebooks"() TO "service_role";



GRANT ALL ON FUNCTION "public"."report_customer_analysis"() TO "anon";
GRANT ALL ON FUNCTION "public"."report_customer_analysis"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."report_customer_analysis"() TO "service_role";



GRANT ALL ON FUNCTION "public"."report_sales_by_category"() TO "anon";
GRANT ALL ON FUNCTION "public"."report_sales_by_category"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."report_sales_by_category"() TO "service_role";



GRANT ALL ON FUNCTION "public"."report_sales_by_time"() TO "anon";
GRANT ALL ON FUNCTION "public"."report_sales_by_time"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."report_sales_by_time"() TO "service_role";



GRANT ALL ON TABLE "public"."authors" TO "anon";
GRANT ALL ON TABLE "public"."authors" TO "authenticated";
GRANT ALL ON TABLE "public"."authors" TO "service_role";



GRANT ALL ON SEQUENCE "public"."authors_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."authors_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."authors_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."cart_items" TO "anon";
GRANT ALL ON TABLE "public"."cart_items" TO "authenticated";
GRANT ALL ON TABLE "public"."cart_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."cart_items_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."cart_items_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."cart_items_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."carts" TO "anon";
GRANT ALL ON TABLE "public"."carts" TO "authenticated";
GRANT ALL ON TABLE "public"."carts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."carts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."carts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."carts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."categories_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."categories_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."categories_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."download_links" TO "anon";
GRANT ALL ON TABLE "public"."download_links" TO "authenticated";
GRANT ALL ON TABLE "public"."download_links" TO "service_role";



GRANT ALL ON SEQUENCE "public"."download_links_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."download_links_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."download_links_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ebooks" TO "anon";
GRANT ALL ON TABLE "public"."ebooks" TO "authenticated";
GRANT ALL ON TABLE "public"."ebooks" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ebooks_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ebooks_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ebooks_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."order_items_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."order_items_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."order_items_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."payments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."payments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."payments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."report_best_selling_ebooks" TO "anon";
GRANT ALL ON TABLE "public"."report_best_selling_ebooks" TO "authenticated";
GRANT ALL ON TABLE "public"."report_best_selling_ebooks" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."report_customer_analysis" TO "anon";
GRANT ALL ON TABLE "public"."report_customer_analysis" TO "authenticated";
GRANT ALL ON TABLE "public"."report_customer_analysis" TO "service_role";



GRANT ALL ON TABLE "public"."report_order_status_summary" TO "anon";
GRANT ALL ON TABLE "public"."report_order_status_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."report_order_status_summary" TO "service_role";



GRANT ALL ON TABLE "public"."report_sales_by_category" TO "anon";
GRANT ALL ON TABLE "public"."report_sales_by_category" TO "authenticated";
GRANT ALL ON TABLE "public"."report_sales_by_category" TO "service_role";



GRANT ALL ON TABLE "public"."report_sales_by_time" TO "anon";
GRANT ALL ON TABLE "public"."report_sales_by_time" TO "authenticated";
GRANT ALL ON TABLE "public"."report_sales_by_time" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON SEQUENCE "public"."reviews_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."reviews_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."reviews_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."wishlists" TO "anon";
GRANT ALL ON TABLE "public"."wishlists" TO "authenticated";
GRANT ALL ON TABLE "public"."wishlists" TO "service_role";



GRANT ALL ON SEQUENCE "public"."wishlists_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."wishlists_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."wishlists_id_seq" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







