const { createClient } = require('@supabase/supabase-js');
const { sendEmail } = require('./_resend');
const { EMAIL_1, EMAIL_2, EMAIL_3 } = require('./_templates');

// Khởi tạo Supabase client dùng Service Role Key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const { name, email, phone, yob, khoKhan, mongMuon } = body;

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Thiếu thông tin Họ tên hoặc Email' });
    }

    // 1. Tìm hoặc tạo khách hàng trong Supabase
    let customerId;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    const cleanPhone = phone ? phone.replace(/[\s\-\.]/g, '') : null;

    // Tính ngày gửi email 2 (sau 2 ngày) và email 3 (sau 3 ngày từ lúc đăng ký)
    const now = new Date();
    const email2DueDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const email3DueDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

    const customerPayload = {
      name,
      phone: cleanPhone,
      email,
      registration_date: now.toISOString(),
      // Các cột mở rộng cho chiến dịch email (nếu có trong DB)
      email_1_sent: true,
      email_2_sent: false,
      email_3_sent: false,
      email_2_due_date: email2DueDate,
      email_3_due_date: email3DueDate
    };

    if (existingCustomer) {
      customerId = existingCustomer.id;
      // Cập nhật thông tin khách hàng hiện tại
      // Dùng try-catch để phòng trường hợp DB chưa được chạy câu lệnh ALTER TABLE thêm cột
      try {
        await supabase
          .from('customers')
          .update(customerPayload)
          .eq('id', customerId);
      } catch (dbErr) {
        // Fallback: Nếu lỗi do thiếu cột email marketing, chỉ cập nhật name và phone
        await supabase
          .from('customers')
          .update({ name, phone: cleanPhone })
          .eq('id', customerId);
      }
    } else {
      // Thêm mới khách hàng
      try {
        const { data: newCustomer, error: insertErr } = await supabase
          .from('customers')
          .insert([customerPayload])
          .select()
          .single();
        
        if (insertErr) throw insertErr;
        customerId = newCustomer.id;
      } catch (dbErr) {
        // Fallback: Thêm mới chỉ với các cột cơ bản ban đầu
        const { data: newCustomer } = await supabase
          .from('customers')
          .insert([{ name, phone: cleanPhone, email }])
          .select()
          .single();
        customerId = newCustomer.id;
      }
    }

    const isTestMode = email.includes('+test') || email.toLowerCase() === 'ducloiarsenal@gmail.com';

    // 2. Gửi Email 1 ngay lập tức qua Resend
    let email1Result = null;
    try {
      email1Result = await sendEmail({
        to: email,
        subject: '[NTPT] Nhận tài liệu đi, đừng để căn nhà "vật" mình thêm ngày nào nữa!',
        html: EMAIL_1
      });
    } catch (mailErr) {
      console.error('Lỗi khi gửi Email 1:', mailErr.message);
    }

    // 3. Xử lý chế độ Test (+test): Gửi luôn Email 2 và Email 3 lập tức
    let email2Result = null;
    let email3Result = null;

    if (isTestMode) {
      console.log('Chạy chế độ test: Gửi toàn bộ email sequence ngay lập tức!');
      
      // Chờ một chút trước khi gửi email tiếp theo để tránh spam rate limit của Resend
      await new Promise(resolve => setTimeout(resolve, 1500));
      try {
        email2Result = await sendEmail({
          to: email,
          subject: '[NTPT] Ngủ sai hướng, tiền bạc đội nón ra đi – Lỗi ngu ngốc nhất 90% người mắc phải!',
          html: EMAIL_2
        });
      } catch (mailErr) {
        console.error('Lỗi khi gửi Email 2 (Test):', mailErr.message);
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
      try {
        email3Result = await sendEmail({
          to: email,
          subject: '[NTPT] Có bệnh thì phải uống thuốc - Nhà lỗi hướng thì phải dùng thứ này!',
          html: EMAIL_3
        });
      } catch (mailErr) {
        console.error('Lỗi khi gửi Email 3 (Test):', mailErr.message);
      }

      // Cập nhật trạng thái đã gửi trong Supabase (nếu có cột)
      try {
        await supabase
          .from('customers')
          .update({ email_2_sent: true, email_3_sent: true })
          .eq('id', customerId);
      } catch (err) {}
    }

    return res.status(200).json({
      success: true,
      message: isTestMode 
        ? 'Đăng ký thành công và đã gửi cả 3 email test ngay lập tức!' 
        : 'Đăng ký thành công và đã gửi Email chào mừng (Email 1)!',
      customerId,
      testMode: isTestMode,
      results: {
        email1: email1Result,
        email2: email2Result,
        email3: email3Result
      }
    });

  } catch (error) {
    console.error('Lỗi xử lý waitlist:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
