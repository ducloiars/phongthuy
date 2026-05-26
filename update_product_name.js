require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function update() {
  const { data, error } = await supabase
    .from('products')
    .update({
      name: "Công Thức Tối Ưu Chi Phí Ads Thời Trang Dưới 15K/Mess Cho Chủ Shop Tự Bơi",
      description: "Ngừng đốt tiền cho agency ảo, tự làm chủ chiến dịch tin nhắn ra đơn chỉ sau 15 phút xem video và làm theo."
    })
    .eq('price', 199000)
    .select();

  console.log("Error:", error);
  console.log("Updated data:", data);
}

update();
