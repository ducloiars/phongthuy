const { createClient } = require('@supabase/supabase-js');

// Khởi tạo Supabase client dùng Service Role Key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  // GET handler for testing connectivity
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'active', 
      message: 'SePay Webhook (CommonJS) is ready' 
    });
  }

  // POST handler for SePay
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const data = req.body;
    const content = data.content || '';
    const orderIdMatch = content.match(/NTPT\d+/i);
    
    if (orderIdMatch) {
      const orderIdPart = orderIdMatch[0].toUpperCase();
      
      const { data: order, error: findError } = await supabase
        .from('orders')
        .select('*')
        .eq('order_code', orderIdPart)
        .eq('status', 'pending')
        .single();

      if (order) {
        const { error: updateError } = await supabase
          .from('orders')
          .update({ status: 'success' })
          .eq('id', order.id);

        if (updateError) {
          return res.status(500).json({ success: false, error: 'Database update failed' });
        }
        return res.status(200).json({ success: true, message: 'Order updated to success' });
      }
    }
    return res.status(200).json({ success: false, message: 'No matching order found' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
