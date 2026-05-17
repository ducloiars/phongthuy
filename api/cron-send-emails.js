const { createClient } = require('@supabase/supabase-js');
const { sendEmail } = require('./_resend');
const { EMAIL_2, EMAIL_3 } = require('./_templates');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  // Chỉ cho phép chạy nếu có cấu hình CRON hoặc để test
  // Trong môi trường production của Vercel, ta có thể kiểm tra CRON secret header
  // const cronSecret = req.headers['x-vercel-cron-secret'];
  
  try {
    const now = new Date().toISOString();
    let sentCount = 0;

    // 1. Gửi Email 2 (Nurture - sau 2 ngày)
    const { data: listEmail2, error: err2 } = await supabase
      .from('customers')
      .select('*')
      .eq('email_2_sent', false)
      .lte('email_2_due_date', now);

    if (err2) throw err2;

    for (const customer of listEmail2) {
      try {
        await sendEmail({
          to: customer.email,
          subject: '[NTPT] Ngủ sai hướng, tiền bạc đội nón ra đi – Lỗi ngu ngốc nhất 90% người mắc phải!',
          html: EMAIL_2
        });
        
        await supabase
          .from('customers')
          .update({ email_2_sent: true })
          .eq('id', customer.id);
        
        sentCount++;
        // Chờ 1 giây để tránh vượt giới hạn tốc độ gửi (rate limit) của Resend
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.error(`Lỗi khi gửi Email 2 cho ${customer.email}:`, err.message);
      }
    }

    // 2. Gửi Email 3 (Chốt sales - sau 1 ngày từ Email 2, tức 3 ngày từ lúc đăng ký)
    const { data: listEmail3, error: err3 } = await supabase
      .from('customers')
      .select('*')
      .eq('email_3_sent', false)
      .lte('email_3_due_date', now);

    if (err3) throw err3;

    for (const customer of listEmail3) {
      try {
        await sendEmail({
          to: customer.email,
          subject: '[NTPT] Có bệnh thì phải uống thuốc - Nhà lỗi hướng thì phải dùng thứ này!',
          html: EMAIL_3
        });
        
        await supabase
          .from('customers')
          .update({ email_3_sent: true })
          .eq('id', customer.id);
        
        sentCount++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.error(`Lỗi khi gửi Email 3 cho ${customer.email}:`, err.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Đã xử lý xong chiến dịch email marketing tự động!`,
      emails_sent: sentCount
    });

  } catch (error) {
    console.error('Lỗi chạy cron gửi email:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
