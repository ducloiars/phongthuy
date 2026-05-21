-- BỔ SUNG CỘT CHO TÍNH NĂNG THÔNG BÁO ĐƠN HÀNG MỚI (TÍN HIỆU 01)
-- Hãy copy và chạy đoạn mã này trong Supabase Dashboard -> SQL Editor -> New Query -> Run.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_notified BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

-- Cập nhật tất cả các đơn hàng cũ thành đã thông báo (is_notified = true)
-- để tránh việc AI gửi tin nhắn hàng loạt cho các đơn hàng cũ.
UPDATE orders SET is_notified = true WHERE is_notified IS NULL OR is_notified = false;
