# E-Book Mart Data Dictionary

เอกสารนี้สรุป schema `public` จากไฟล์ [`ebookmart_live_schema.sql`](ebookmart_live_schema.sql) ซึ่งเป็น schema dump จาก Supabase ไม่รวมค่าข้อมูลจริงในตาราง

## สรุปตาราง

| ตาราง | ความหมาย |
|---|---|
| `roles` | บทบาทผู้ใช้ |
| `users` | บัญชีผู้ใช้และข้อมูลติดต่อ |
| `categories` | หมวดหมู่ e-book |
| `authors` | ผู้แต่ง |
| `ebooks` | รายการ e-book และข้อมูลการขาย |
| `carts` | ตะกร้าของผู้ใช้ |
| `cart_items` | รายการหนังสือในตะกร้า |
| `orders` | คำสั่งซื้อ |
| `order_items` | รายการหนังสือในคำสั่งซื้อ |
| `payments` | รายการชำระเงิน |
| `download_links` | token และสถานะลิงก์ดาวน์โหลด |
| `reviews` | รีวิวและคะแนนหนังสือ |
| `wishlists` | หนังสือที่ผู้ใช้บันทึกไว้ |

`id` ที่ระบุว่า auto-increment ใช้ sequence ของ PostgreSQL และเป็น primary key ตาม schema

## ตารางและคอลัมน์

### `roles`

บทบาทของบัญชี เช่น `customer` หรือ `admin`.

| คอลัมน์ | ชนิด / nullability / default | ความหมาย / ข้อจำกัด |
|---|---|---|
| `id` | `integer`, NOT NULL, auto-increment | Primary key |
| `name` | `varchar(50)`, NOT NULL | ชื่อบทบาท; UNIQUE |
| `description` | `text`, NULL | คำอธิบาย |
| `created_at` | `timestamp`, NULL, DEFAULT `CURRENT_TIMESTAMP` | เวลาสร้างรายการ |

### `users`

บัญชีผู้ใช้ ข้อมูลล็อกอิน และข้อมูลติดต่อ.

| คอลัมน์ | ชนิด / nullability / default | ความหมาย / ข้อจำกัด |
|---|---|---|
| `id` | `integer`, NOT NULL, auto-increment | Primary key |
| `role_id` | `integer`, NOT NULL | Foreign key ไป `roles.id`; ลบ role ที่มีผู้ใช้อ้างถึงไม่ได้ |
| `email` | `varchar(100)`, NOT NULL | อีเมลล็อกอิน; UNIQUE |
| `password_hash` | `varchar(255)`, NOT NULL | password hash; ห้ามเก็บรหัสผ่าน plaintext |
| `name` | `varchar(100)`, NOT NULL | ชื่อผู้ใช้ |
| `phone` | `varchar(20)`, NULL | เบอร์โทรศัพท์ |
| `address` | `text`, NULL | ที่อยู่ |
| `is_active` | `boolean`, NULL, DEFAULT `true` | สถานะบัญชี |
| `created_at` | `timestamp`, NULL, DEFAULT `CURRENT_TIMESTAMP` | เวลาสร้างบัญชี |
| `updated_at` | `timestamp`, NULL, DEFAULT `CURRENT_TIMESTAMP` | เวลาแก้ไขล่าสุด |

### `categories`

หมวดหมู่ของ e-book.

| คอลัมน์ | ชนิด / nullability / default | ความหมาย / ข้อจำกัด |
|---|---|---|
| `id` | `integer`, NOT NULL, auto-increment | Primary key |
| `name` | `varchar(100)`, NOT NULL | ชื่อหมวดหมู่; UNIQUE |
| `description` | `text`, NULL | คำอธิบาย |
| `is_active` | `boolean`, NULL, DEFAULT `true` | สถานะการใช้งาน |
| `created_at` | `timestamp`, NULL, DEFAULT `CURRENT_TIMESTAMP` | เวลาสร้างรายการ |

### `authors`

ข้อมูลผู้แต่ง e-book.

| คอลัมน์ | ชนิด / nullability / default | ความหมาย / ข้อจำกัด |
|---|---|---|
| `id` | `integer`, NOT NULL, auto-increment | Primary key |
| `name` | `varchar(100)`, NOT NULL | ชื่อผู้แต่ง |
| `bio` | `text`, NULL | ประวัติผู้แต่ง |
| `created_at` | `timestamp`, NULL, DEFAULT `CURRENT_TIMESTAMP` | เวลาสร้างรายการ |

### `ebooks`

รายการหนังสืออิเล็กทรอนิกส์ ราคา สต็อก และ URL ที่เกี่ยวข้อง.

| คอลัมน์ | ชนิด / nullability / default | ความหมาย / ข้อจำกัด |
|---|---|---|
| `id` | `integer`, NOT NULL, auto-increment | Primary key |
| `category_id` | `integer`, NOT NULL | Foreign key ไป `categories.id`; ลบหมวดที่ถูกใช้อยู่ไม่ได้ |
| `author_id` | `integer`, NOT NULL | Foreign key ไป `authors.id`; ลบผู้แต่งที่ถูกใช้อยู่ไม่ได้ |
| `title` | `varchar(200)`, NOT NULL | ชื่อหนังสือ |
| `description` | `text`, NULL | รายละเอียดหนังสือ |
| `price` | `numeric(10,2)`, NOT NULL | ราคา; ต้องมากกว่า 0 |
| `cover_url` | `varchar(500)`, NULL | URL รูปปก |
| `download_url` | `varchar(500)`, NULL | URL ไฟล์สำหรับดาวน์โหลด |
| `stock` | `integer`, NULL, DEFAULT `0` | จำนวนคงเหลือ; ต้องไม่น้อยกว่า 0 |
| `is_active` | `boolean`, NULL, DEFAULT `true` | สถานะพร้อมขาย |
| `created_at` | `timestamp`, NULL, DEFAULT `CURRENT_TIMESTAMP` | เวลาสร้างรายการ |
| `updated_at` | `timestamp`, NULL, DEFAULT `CURRENT_TIMESTAMP` | เวลาแก้ไขล่าสุด |

### `carts`

ตะกร้าสินค้าของผู้ใช้.

| คอลัมน์ | ชนิด / nullability / default | ความหมาย / ข้อจำกัด |
|---|---|---|
| `id` | `integer`, NOT NULL, auto-increment | Primary key |
| `user_id` | `integer`, NOT NULL | Foreign key ไป `users.id`; ลบผู้ใช้แล้วลบตะกร้าตาม |
| `status` | `varchar(20)`, NULL, DEFAULT `'active'` | สถานะ: `active`, `converted`, `abandoned` |
| `created_at` | `timestamp`, NULL, DEFAULT `CURRENT_TIMESTAMP` | เวลาสร้างตะกร้า |
| `updated_at` | `timestamp`, NULL, DEFAULT `CURRENT_TIMESTAMP` | เวลาแก้ไขล่าสุด |

### `cart_items`

หนังสือและจำนวนที่อยู่ในตะกร้า โดย `price` เก็บราคาขณะเพิ่มลงตะกร้า.

| คอลัมน์ | ชนิด / nullability / default | ความหมาย / ข้อจำกัด |
|---|---|---|
| `id` | `integer`, NOT NULL, auto-increment | Primary key |
| `cart_id` | `integer`, NOT NULL | Foreign key ไป `carts.id`; ลบตะกร้าแล้วลบรายการตาม |
| `ebook_id` | `integer`, NOT NULL | Foreign key ไป `ebooks.id`; ลบหนังสือที่อยู่ในตะกร้าไม่ได้ |
| `quantity` | `integer`, NOT NULL, DEFAULT `1` | จำนวน; ต้องมากกว่า 0 |
| `price` | `numeric(10,2)`, NOT NULL | ราคาต่อหน่วย ณ เวลาเพิ่มลงตะกร้า; ต้องมากกว่า 0 |
| `added_at` | `timestamp`, NULL, DEFAULT `CURRENT_TIMESTAMP` | เวลาเพิ่มรายการ |

### `orders`

คำสั่งซื้อและสถานะการดำเนินการ.

| คอลัมน์ | ชนิด / nullability / default | ความหมาย / ข้อจำกัด |
|---|---|---|
| `id` | `integer`, NOT NULL, auto-increment | Primary key |
| `user_id` | `integer`, NOT NULL | Foreign key ไป `users.id`; ลบผู้ใช้ที่มีคำสั่งซื้อไม่ได้ |
| `total_amount` | `numeric(10,2)`, NOT NULL | ยอดรวม; ต้องมากกว่า 0 |
| `status` | `varchar(20)`, NOT NULL, DEFAULT `'pending'` | สถานะ: `pending`, `paid`, `confirmed`, `cancelled` |
| `payment_slip_url` | `varchar(500)`, NULL | URL สลิปชำระเงิน |
| `notes` | `text`, NULL | หมายเหตุคำสั่งซื้อ |
| `created_at` | `timestamp`, NULL, DEFAULT `CURRENT_TIMESTAMP` | เวลาสร้างคำสั่งซื้อ |
| `updated_at` | `timestamp`, NULL, DEFAULT `CURRENT_TIMESTAMP` | เวลาแก้ไขล่าสุด |
| `payment_method` | `text`, NULL | วิธีชำระเงิน |

### `order_items`

รายละเอียดหนังสือแต่ละรายการในคำสั่งซื้อ โดย `price` และ `subtotal` เก็บค่าราคา ณ เวลาซื้อ.

| คอลัมน์ | ชนิด / nullability / default | ความหมาย / ข้อจำกัด |
|---|---|---|
| `id` | `integer`, NOT NULL, auto-increment | Primary key |
| `order_id` | `integer`, NOT NULL | Foreign key ไป `orders.id`; ลบคำสั่งซื้อแล้วลบรายการตาม |
| `ebook_id` | `integer`, NOT NULL | Foreign key ไป `ebooks.id`; ลบหนังสือที่อยู่ในคำสั่งซื้อไม่ได้ |
| `quantity` | `integer`, NOT NULL | จำนวน; ต้องมากกว่า 0 |
| `price` | `numeric(10,2)`, NOT NULL | ราคาต่อหน่วย; ต้องมากกว่า 0 |
| `subtotal` | `numeric(10,2)`, NOT NULL | ยอดย่อย; ต้องมากกว่า 0 |

### `payments`

ข้อมูลการชำระเงิน โดย `order_id` เป็น UNIQUE ทำให้หนึ่งคำสั่งซื้อมี payment row ได้ไม่เกินหนึ่งรายการ.

| คอลัมน์ | ชนิด / nullability / default | ความหมาย / ข้อจำกัด |
|---|---|---|
| `id` | `integer`, NOT NULL, auto-increment | Primary key |
| `order_id` | `integer`, NOT NULL | Foreign key ไป `orders.id`; UNIQUE; ลบคำสั่งซื้อแล้วลบ payment ตาม |
| `amount` | `numeric(10,2)`, NOT NULL | จำนวนเงิน; ต้องมากกว่า 0 |
| `payment_method` | `varchar(50)`, NOT NULL | วิธีชำระเงิน |
| `slip_url` | `varchar(500)`, NULL | URL สลิป |
| `status` | `varchar(20)`, NULL, DEFAULT `'pending'` | สถานะ: `pending`, `verified`, `rejected` |
| `paid_at` | `timestamp`, NULL | เวลาที่ชำระเงิน |
| `created_at` | `timestamp`, NULL, DEFAULT `CURRENT_TIMESTAMP` | เวลาสร้างรายการ |

### `download_links`

ลิงก์ดาวน์โหลดที่ผูกกับรายการหนังสือในคำสั่งซื้อ.

| คอลัมน์ | ชนิด / nullability / default | ความหมาย / ข้อจำกัด |
|---|---|---|
| `id` | `integer`, NOT NULL, auto-increment | Primary key |
| `order_item_id` | `integer`, NOT NULL | Foreign key ไป `order_items.id`; UNIQUE; ลบรายการสั่งซื้อแล้วลิงก์ตาม |
| `token` | `varchar(255)`, NOT NULL | token สำหรับเข้าถึงลิงก์; UNIQUE |
| `expires_at` | `timestamp`, NOT NULL | วันหมดอายุ |
| `downloaded_at` | `timestamp`, NULL | เวลาดาวน์โหลด (ถ้ามี) |
| `created_at` | `timestamp`, NULL, DEFAULT `CURRENT_TIMESTAMP` | เวลาสร้างลิงก์ |

### `reviews`

รีวิวหนังสือจากผู้ใช้ จำกัดหนึ่งรีวิวต่อผู้ใช้ต่อหนังสือ.

| คอลัมน์ | ชนิด / nullability / default | ความหมาย / ข้อจำกัด |
|---|---|---|
| `id` | `integer`, NOT NULL, auto-increment | Primary key |
| `user_id` | `integer`, NOT NULL | Foreign key ไป `users.id`; ลบผู้ใช้แล้วลบรีวิวตาม |
| `ebook_id` | `integer`, NOT NULL | Foreign key ไป `ebooks.id`; ลบหนังสือแล้วลบรีวิวตาม |
| `rating` | `integer`, NOT NULL | คะแนน 1-5 |
| `comment` | `text`, NULL | ข้อความรีวิว |
| `created_at` | `timestamp`, NULL, DEFAULT `CURRENT_TIMESTAMP` | เวลาสร้างรีวิว |
| `updated_at` | `timestamp`, NULL, DEFAULT `CURRENT_TIMESTAMP` | เวลาแก้ไขรีวิวล่าสุด |

ข้อจำกัดเพิ่มเติม: UNIQUE (`user_id`, `ebook_id`) และ CHECK `rating` อยู่ระหว่าง 1 ถึง 5.

### `wishlists`

รายการหนังสือที่ผู้ใช้บันทึกไว้.

| คอลัมน์ | ชนิด / nullability / default | ความหมาย / ข้อจำกัด |
|---|---|---|
| `id` | `integer`, NOT NULL, auto-increment | Primary key |
| `user_id` | `integer`, NOT NULL | Foreign key ไป `users.id`; ลบผู้ใช้แล้วลบรายการตาม |
| `ebook_id` | `integer`, NOT NULL | Foreign key ไป `ebooks.id`; ลบหนังสือแล้วลบรายการตาม |
| `created_at` | `timestamp`, NULL, DEFAULT `CURRENT_TIMESTAMP` | เวลาบันทึกรายการ |

ข้อจำกัดเพิ่มเติม: UNIQUE (`user_id`, `ebook_id`) ป้องกันการบันทึกหนังสือเล่มเดิมซ้ำ.

## ความสัมพันธ์

| จาก | ไป | Cardinality / พฤติกรรม |
|---|---|---|
| `users.role_id` | `roles.id` | role หนึ่งมีผู้ใช้ได้หลายคน; `RESTRICT` |
| `ebooks.category_id` | `categories.id` | หมวดหมู่หนึ่งมีหนังสือได้หลายเล่ม; `RESTRICT` |
| `ebooks.author_id` | `authors.id` | ผู้แต่งหนึ่งคนมีหนังสือได้หลายเล่ม; `RESTRICT` |
| `carts.user_id` | `users.id` | ผู้ใช้หนึ่งคนมีตะกร้าได้หลายรายการ; `CASCADE` เมื่อลบผู้ใช้ |
| `cart_items.cart_id` | `carts.id` | ตะกร้าหนึ่งมีรายการได้หลายรายการ; `CASCADE` เมื่อลบตะกร้า |
| `cart_items.ebook_id` | `ebooks.id` | หนังสือหนึ่งเล่มอาจอยู่ในหลายรายการตะกร้า; `RESTRICT` |
| `orders.user_id` | `users.id` | ผู้ใช้หนึ่งคนมีคำสั่งซื้อได้หลายรายการ; `RESTRICT` |
| `order_items.order_id` | `orders.id` | คำสั่งซื้อหนึ่งมีรายการหนังสือได้หลายรายการ; `CASCADE` เมื่อลบคำสั่งซื้อ |
| `order_items.ebook_id` | `ebooks.id` | หนังสือหนึ่งเล่มอยู่ในหลายรายการสั่งซื้อได้; `RESTRICT` |
| `payments.order_id` | `orders.id` | หนึ่งคำสั่งซื้อต่อ payment ได้ไม่เกินหนึ่งรายการ; `CASCADE` เมื่อลบคำสั่งซื้อ |
| `download_links.order_item_id` | `order_items.id` | หนึ่งรายการสั่งซื้อต่อ download link ได้ไม่เกินหนึ่งรายการ; `CASCADE` เมื่อลบรายการ |
| `reviews.user_id` | `users.id` | ผู้ใช้หนึ่งคนเขียนรีวิวได้หลายรายการ; `CASCADE` เมื่อลบผู้ใช้ |
| `reviews.ebook_id` | `ebooks.id` | หนังสือหนึ่งเล่มมีรีวิวได้หลายรายการ; `CASCADE` เมื่อลบหนังสือ |
| `wishlists.user_id` | `users.id` | ผู้ใช้หนึ่งคนมี wishlist entries ได้หลายรายการ; `CASCADE` เมื่อลบผู้ใช้ |
| `wishlists.ebook_id` | `ebooks.id` | หนังสือหนึ่งเล่มอยู่ใน wishlist ได้หลายรายการ; `CASCADE` เมื่อลบหนังสือ |

## Views สำหรับรายงาน

| View | ข้อมูลที่แสดง |
|---|---|
| `report_best_selling_ebooks` | หนังสือขายดี พร้อมผู้แต่ง หมวดหมู่ จำนวนขาย และรายได้; จำกัด 10 รายการ |
| `report_customer_analysis` | สรุปคำสั่งซื้อและยอดใช้จ่ายต่อลูกค้า |
| `report_order_status_summary` | จำนวนคำสั่งซื้อและยอดรวม แยกตามสถานะ |
| `report_sales_by_category` | จำนวนหนังสือและยอดขาย แยกตามหมวดหมู่ |
| `report_sales_by_time` | จำนวนคำสั่งซื้อ ยอดขาย และค่าเฉลี่ย แยกตามเดือน |

## Functions / RPC

| Function | หน้าที่ตาม SQL body |
|---|---|
| `add_to_cart(p_user_id, p_ebook_id, p_quantity)` | หา/สร้างตะกร้าที่ active แล้วเพิ่มสินค้า หรือเพิ่มจำนวนรายการเดิม |
| `create_order_from_cart(p_user_id, p_payment_method, p_slip_url)` | สร้างคำสั่งซื้อและ payment จากตะกร้า คัดลอกรายการ แล้ว mark ตะกร้า converted |
| `confirm_order(p_order_id)` | เปลี่ยนสถานะ order/payment และสร้าง download link ให้แต่ละ order item |
| `report_best_selling_ebooks()` | คืนข้อมูลยอดขายรวมต่อหนังสือ |
| `report_customer_analysis()` | คืนจำนวนคำสั่งซื้อและยอดใช้จ่ายต่อผู้ใช้ |
| `report_sales_by_category()` | คืนยอดขายและจำนวนชิ้นต่อหมวดหมู่ |
| `report_sales_by_time()` | คืนยอดขายและจำนวนคำสั่งซื้อต่อเดือน |

## หมายเหตุ

- `timestamp` ใน dump เป็น `timestamp without time zone`.
- `DEFAULT CURRENT_TIMESTAMP` ไม่ได้แปลว่าคอลัมน์เป็น `NOT NULL`; ระบุ nullability ตาม DDL ที่ dump ไว้.
- รายละเอียดเชิงธุรกิจที่ไม่มี SQL comment รองรับเป็นคำอธิบายจากชื่อ field และการใช้งานใน schema.
- เอกสารนี้เป็น snapshot ตาม schema dump ปัจจุบัน หาก schema ใน Supabase เปลี่ยน ควรสร้างเอกสารใหม่จาก dump ล่าสุด.