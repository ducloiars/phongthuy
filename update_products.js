require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Lỗi: Không tìm thấy SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong file .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const newProducts = [
  {
    name: "Sổ Tay Quy Trình Setup 60 Phút & 15 Mẫu Content Ads Thời Trang",
    price: 199000,
    description: "Quy trình từng bước thiết lập chiến dịch quảng cáo tin nhắn ngành thời trang và bộ 15 mẫu viết bài điền vào chỗ trống.",
    image_url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80",
    quantity: 999
  },
  {
    name: "Cẩm Nang Sơ Cứu Ads & Quy Trình Kháng Tài Khoản Facebook",
    price: 250000,
    description: "Các bước chẩn đoán lỗi quảng cáo đắt đỏ và bộ tài liệu hướng dẫn kháng nghị tài khoản quảng cáo, fanpage bị hạn chế.",
    image_url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80",
    quantity: 999
  },
  {
    name: "Kịch Bản Telegram Bot Tư Vấn Thời Trang Tự Động",
    price: 390000,
    description: "Cấu hình kịch bản tự động hóa trực chat, tư vấn chọn size, thu thập số điện thoại khách hàng thông qua Telegram Bot.",
    image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
    quantity: 999
  }
];

async function updateProducts() {
  try {
    console.log("Đang xóa các sản phẩm cũ...");
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Xóa tất cả

    if (deleteError) {
      throw deleteError;
    }

    console.log("Đang nạp các sản phẩm mới...");
    const { data, error: insertError } = await supabase
      .from('products')
      .insert(newProducts)
      .select();

    if (insertError) {
      throw insertError;
    }

    console.log("Cập nhật thành công! Danh sách sản phẩm mới:");
    console.log(data);
  } catch (error) {
    console.error("Gặp lỗi khi cập nhật:", error.message);
  }
}

updateProducts();
