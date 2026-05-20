const express = require('express');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { z } = require('zod');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

// Load environment variables from root .env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// SQLite connection
const dbPath = path.join(__dirname, '../brain.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error(`[${new Date().toISOString()}] Lỗi mở database brain.db:`, err.message);
  } else {
    console.log(`[${new Date().toISOString()}] Kết nối thành công tới SQLite brain.db`);
  }
});

// Helper function to query brand/business name from SQLite
function getBusinessContext() {
  return new Promise((resolve) => {
    db.get("SELECT content FROM business WHERE title = 'Sản phẩm khóa học AI' OR title = 'Khách hàng mục tiêu' LIMIT 1", (err, row) => {
      if (err || !row) {
        resolve("Nghệ Thuật Phong Thủy");
      } else {
        resolve(row.content);
      }
    });
  });
}

// Map to store transports by session ID
const transports = {};

const serverInfo = {
  name: 'phongthuy-mcp-server',
  version: '1.0.0'
};

// Function to instantiate a new server configuration and register the 3 tools
const createServer = () => {
  const server = new McpServer(serverInfo);

  // 1. Tool get_daily_report
  server.registerTool('get_daily_report', {
    description: 'Lấy báo cáo số lượt đăng ký waitlist mới, số lượng đơn hàng, và tổng doanh thu thực tế trong ngày.',
    inputSchema: {
      date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày phải là YYYY-MM-DD')
        .optional()
        .describe('Ngày báo cáo (định dạng YYYY-MM-DD). Mặc định là hôm nay.')
    }
  }, async ({ date }) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Gọi tool 'get_daily_report' với params:`, { date });
    
    try {
      const reportDate = date || new Date().toISOString().split('T')[0];
      
      // Tạo khoảng thời gian trong ngày
      const start = new Date(`${reportDate}T00:00:00.000Z`).toISOString();
      const end = new Date(`${reportDate}T23:59:59.999Z`).toISOString();
      
      // Lấy thông tin ngày hôm trước để so sánh
      const prevDateObj = new Date(`${reportDate}T12:00:00Z`);
      prevDateObj.setDate(prevDateObj.getDate() - 1);
      const prevDateStr = prevDateObj.toISOString().split('T')[0];
      const prevStart = new Date(`${prevDateStr}T00:00:00.000Z`).toISOString();
      const prevEnd = new Date(`${prevDateStr}T23:59:59.999Z`).toISOString();

      // 1. Query hôm nay
      const { data: customersToday, error: custErr } = await supabase
        .from('customers')
        .select('id')
        .gte('registration_date', start)
        .lte('registration_date', end);
        
      if (custErr) throw custErr;
      
      const { data: ordersToday, error: ordErr } = await supabase
        .from('orders')
        .select('amount, status')
        .gte('purchase_date', start)
        .lte('purchase_date', end);
        
      if (ordErr) throw ordErr;
      
      // 2. Query hôm qua
      const { data: customersYesterday } = await supabase
        .from('customers')
        .select('id')
        .gte('registration_date', prevStart)
        .lte('registration_date', prevEnd);
        
      const { data: ordersYesterday } = await supabase
        .from('orders')
        .select('amount, status')
        .gte('purchase_date', prevStart)
        .lte('purchase_date', prevEnd);

      // Tính toán số liệu
      const todayRegs = customersToday ? customersToday.length : 0;
      const yesterdayRegs = customersYesterday ? customersYesterday.length : 0;
      const regDiff = yesterdayRegs > 0 ? Math.round(((todayRegs - yesterdayRegs) / yesterdayRegs) * 100) : todayRegs > 0 ? 100 : 0;

      const todaySuccessOrders = ordersToday ? ordersToday.filter(o => o.status === 'success') : [];
      const todaySuccessCount = todaySuccessOrders.length;
      const todayTotalCount = ordersToday ? ordersToday.length : 0;
      const todayRevenue = todaySuccessOrders.reduce((sum, o) => sum + Number(o.amount), 0);

      const yesterdaySuccessOrders = ordersYesterday ? ordersYesterday.filter(o => o.status === 'success') : [];
      const yesterdayRevenue = yesterdaySuccessOrders.reduce((sum, o) => sum + Number(o.amount), 0);
      const revDiff = yesterdayRevenue > 0 ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100) : todayRevenue > 0 ? 100 : 0;

      // Đọc thêm text từ SQLite brain.db để chứng tỏ có kết nối
      const businessContext = await getBusinessContext();

      const formattedRevenue = todayRevenue.toLocaleString('vi-VN');
      const formattedYesterdayRevenue = yesterdayRevenue.toLocaleString('vi-VN');

      let comparisonMsg = ``;
      if (yesterdayRegs > 0) {
        comparisonMsg += `Waitlist: ${todayRegs} lượt (${regDiff >= 0 ? '+' : ''}${regDiff}% so với hôm qua). `;
      } else {
        comparisonMsg += `Waitlist: ${todayRegs} lượt. `;
      }
      if (yesterdayRevenue > 0) {
        comparisonMsg += `Doanh thu: ${formattedRevenue}đ (${revDiff >= 0 ? '+' : ''}${revDiff}% so với hôm qua).`;
      } else {
        comparisonMsg += `Doanh thu: ${formattedRevenue}đ.`;
      }

      const reportMessage = `📊 BÁO CÁO DOANH THU & ĐĂNG KÝ NGÀY ${reportDate}
-----------------------------------------
- Đăng ký Waitlist mới: ${todayRegs} lượt (Hôm qua: ${yesterdayRegs})
- Đơn hàng mới phát sinh: ${todayTotalCount} đơn
- Đơn hàng thanh toán thành công: ${todaySuccessCount} đơn
- Tổng doanh thu thực nhận: ${formattedRevenue}đ (Hôm qua: ${formattedYesterdayRevenue}đ)
- Tình trạng tăng trưởng: ${comparisonMsg}
-----------------------------------------
[Nguồn dữ liệu: ${businessContext}]`;

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            date: reportDate,
            summary: {
              new_registrations: todayRegs,
              yesterday_registrations: yesterdayRegs,
              registrations_growth_percent: regDiff,
              total_orders: todayTotalCount,
              successful_orders: todaySuccessCount,
              revenue_vnd: todayRevenue,
              yesterday_revenue_vnd: yesterdayRevenue,
              revenue_growth_percent: revDiff
            },
            message: reportMessage
          }, null, 2)
        }]
      };
    } catch (error) {
      console.error(`[${timestamp}] Lỗi tool 'get_daily_report':`, error.message);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message,
            message: `❌ Lỗi khi lấy báo cáo: ${error.message}`
          }, null, 2)
        }]
      };
    }
  });

  // 2. Tool manage_customer_email
  server.registerTool('manage_customer_email', {
    description: 'Tra cứu trạng thái gửi email marketing của khách hàng hoặc gửi lại email tài liệu/xác nhận qua Resend.',
    inputSchema: {
      email: z.string().email('Địa chỉ email không đúng định dạng.').describe('Email của khách hàng cần kiểm tra hoặc gửi lại thư.'),
      action: z.enum(['status', 'resend_email_1', 'resend_email_2', 'resend_email_3', 'resend_confirm'])
        .describe('Hành động cần thực hiện: "status" để kiểm tra; "resend_email_1/2/3" để gửi lại email chiến dịch tương ứng; "resend_confirm" để gửi lại email xác nhận đơn hàng thành công.')
    }
  }, async ({ email, action }) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Gọi tool 'manage_customer_email' với params:`, { email, action });
    
    try {
      // 1. Kiểm tra khách hàng trong bảng customers trên Supabase
      const { data: customer, error: custErr } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email)
        .order('registration_date', { ascending: false })
        .limit(1)
        .single();

      if (custErr && custErr.code !== 'PGRST116') {
        throw custErr;
      }

      if (action === 'status') {
        if (!customer) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                message: `🔍 Không tìm thấy thông tin khách hàng với email: ${email} trên hệ thống.`
              }, null, 2)
            }]
          };
        }

        // Tìm thêm các đơn hàng liên quan nếu có
        const { data: orders } = await supabase
          .from('orders')
          .select('*, products(name)')
          .eq('customer_id', customer.id)
          .order('purchase_date', { ascending: false });

        const statusMessage = `👤 THÔNG TIN KHÁCH HÀNG: ${customer.name || 'N/A'}
- Email: ${customer.email}
- SĐT: ${customer.phone || 'N/A'}
- Ngày đăng ký: ${new Date(customer.registration_date).toLocaleString('vi-VN')}
- Email 1 (Gửi ngay): ${customer.email_1_sent ? '✅ Đã gửi' : '❌ Chưa gửi'}
- Email 2 (Sau 2 ngày): ${customer.email_2_sent ? '✅ Đã gửi' : '❌ Chưa gửi'} (Dự kiến gửi: ${customer.email_2_due_date ? new Date(customer.email_2_due_date).toLocaleString('vi-VN') : 'N/A'})
- Email 3 (Sau 3 ngày): ${customer.email_3_sent ? '✅ Đã gửi' : '❌ Chưa gửi'} (Dự kiến gửi: ${customer.email_3_due_date ? new Date(customer.email_3_due_date).toLocaleString('vi-VN') : 'N/A'})
- Lịch sử đơn hàng: ${orders && orders.length > 0 ? `\n${orders.map(o => `  * #${o.order_code || o.id.substring(0,8).toUpperCase()} - ${o.products?.name || 'Sản phẩm'} (${Number(o.amount).toLocaleString('vi-VN')}đ) - Trạng thái: ${o.status}`).join('\n')}` : 'Chưa có đơn hàng nào'}`;

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              customer,
              orders,
              message: statusMessage
            }, null, 2)
          }]
        };
      }

      // Các hành động gửi lại email
      const { sendEmail } = require('../api/_resend');
      const templates = require('../api/_templates');

      let subject = '';
      let htmlContent = '';

      if (action === 'resend_email_1') {
        subject = '[NTPT] Nhận tài liệu Phong Thủy Thực Chiến (Gửi lại)';
        htmlContent = templates.EMAIL_1;
      } else if (action === 'resend_email_2') {
        subject = '[NTPT] Ngủ sai hướng, tiền bạc đội nón ra đi! (Gửi lại)';
        htmlContent = templates.EMAIL_2;
      } else if (action === 'resend_email_3') {
        subject = '[NTPT] Có bệnh thì phải uống thuốc - Nhà lỗi hướng phải trấn ngay! (Gửi lại)';
        htmlContent = templates.EMAIL_3;
      } else if (action === 'resend_confirm') {
        if (!customer) {
          throw new Error('Không thể gửi email xác nhận vì email này chưa đăng ký làm khách hàng.');
        }
        // Tìm đơn hàng thành công gần nhất để lấy thông tin sản phẩm và số tiền
        const { data: latestOrder, error: orderErr } = await supabase
          .from('orders')
          .select('*, products(name)')
          .eq('customer_id', customer.id)
          .eq('status', 'success')
          .order('purchase_date', { ascending: false })
          .limit(1)
          .single();

        if (orderErr || !latestOrder) {
          throw new Error('Không tìm thấy đơn hàng thành công nào của khách hàng này để gửi email xác nhận.');
        }

        subject = `[NTPT] Xác nhận thanh toán thành công đơn hàng #${latestOrder.order_code}`;
        htmlContent = templates.EMAIL_ORDER_CONFIRMATION;
        htmlContent = htmlContent.replace('{{product_name}}', latestOrder.products?.name || 'Vật phẩm phong thủy');
        htmlContent = htmlContent.replace('{{amount}}', Number(latestOrder.amount).toLocaleString('vi-VN'));
        htmlContent = htmlContent.replace('{{order_code}}', latestOrder.order_code || latestOrder.id.substring(0,8).toUpperCase());
      }

      const emailResult = await sendEmail({
        to: email,
        subject,
        html: htmlContent
      });

      // Cập nhật trạng thái đã gửi trong Supabase nếu gửi các email tự động thành công
      if (customer) {
        const updateData = {};
        if (action === 'resend_email_1') updateData.email_1_sent = true;
        if (action === 'resend_email_2') updateData.email_2_sent = true;
        if (action === 'resend_email_3') updateData.email_3_sent = true;
        
        if (Object.keys(updateData).length > 0) {
          await supabase
            .from('customers')
            .update(updateData)
            .eq('id', customer.id);
        }
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            email_result: emailResult,
            message: `📩 Đã gửi thành công email "${subject}" tới hòm thư ${email}.`
          }, null, 2)
        }]
      };

    } catch (error) {
      console.error(`[${timestamp}] Lỗi tool 'manage_customer_email':`, error.message);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message,
            message: `❌ Thao tác email thất bại: ${error.message}`
          }, null, 2)
        }]
      };
    }
  });

  // 3. Tool create_manual_order
  server.registerTool('create_manual_order', {
    description: 'Tạo đơn hàng thủ công trên Supabase (kèm tự động kích hoạt gửi Email Xác nhận kèm tài liệu cho khách).',
    inputSchema: {
      email: z.string().email('Địa chỉ email không đúng định dạng.').describe('Email của khách hàng mua sản phẩm.'),
      product_name: z.string().describe('Tên sản phẩm khách hàng mua (Ví dụ: "Gương Bát Quái Gỗ Đào" hoặc "Tỳ Hưu Thiên Lộc").'),
      amount: z.number().nonnegative('Số tiền thanh toán phải lớn hơn hoặc bằng 0.').describe('Số tiền thanh toán thực tế của khách (VND).'),
      note: z.string().optional().describe('Ghi chú của admin (Ví dụ: "Chuyển khoản tay qua zalo", "Tặng khách VIP").')
    }
  }, async ({ email, product_name, amount, note }) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Gọi tool 'create_manual_order' với params:`, { email, product_name, amount, note });
    
    try {
      // 1. Kiểm tra khách hàng đã tồn tại chưa
      let { data: customer, error: custErr } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email)
        .order('registration_date', { ascending: false })
        .limit(1)
        .single();

      if (custErr && custErr.code !== 'PGRST116') {
        throw custErr;
      }

      // 2. Nếu khách chưa tồn tại, tự động tạo khách hàng mới
      if (!customer) {
        console.log(`[${timestamp}] Không tìm thấy khách hàng. Tiến hành tạo khách hàng mới với email: ${email}`);
        const { data: newCust, error: createCustErr } = await supabase
          .from('customers')
          .insert({
            name: email.split('@')[0], // dùng tạm phần trước @ làm tên
            email: email,
            phone: null,
            email_1_sent: false,
            email_2_sent: false,
            email_3_sent: false
          })
          .select()
          .single();

        if (createCustErr) throw createCustErr;
        customer = newCust;
      }

      // 3. Khớp ID sản phẩm từ bảng products
      let productId = null;
      const { data: allProducts, error: prodErr } = await supabase
        .from('products')
        .select('*');

      if (prodErr) throw prodErr;

      if (allProducts && allProducts.length > 0) {
        const matched = allProducts.find(p => p.name.toLowerCase().includes(product_name.toLowerCase()));
        if (matched) {
          productId = matched.id;
        } else {
          productId = allProducts[0].id;
          console.log(`[${timestamp}] Không khớp được sản phẩm "${product_name}". Tạm thời sử dụng sản phẩm đầu tiên: ${allProducts[0].name}`);
        }
      }

      // 4. Tạo mã đơn hàng độc nhất NTPT + 6 số cuối của timestamp
      const orderCode = `NTPT` + Date.now().toString().slice(-6);

      // 5. Tạo đơn hàng mới với trạng thái success
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          order_code: orderCode,
          customer_id: customer.id,
          product_id: productId,
          amount: amount,
          ghi_chu: note || 'Tạo đơn thủ công từ Telegram',
          status: 'success'
        })
        .select('*, products(name)')
        .single();

      if (orderErr) throw orderErr;

      // 6. Gửi email xác nhận đơn hàng thành công qua Resend
      const { sendEmail } = require('../api/_resend');
      const { EMAIL_ORDER_CONFIRMATION } = require('../api/_templates');

      let htmlContent = EMAIL_ORDER_CONFIRMATION;
      htmlContent = htmlContent.replace('{{product_name}}', order.products?.name || product_name);
      htmlContent = htmlContent.replace('{{amount}}', Number(amount).toLocaleString('vi-VN'));
      htmlContent = htmlContent.replace('{{order_code}}', orderCode);

      let emailResult = null;
      try {
        emailResult = await sendEmail({
          to: email,
          subject: `[NTPT] Xác nhận thanh toán thành công đơn hàng #${orderCode}`,
          html: htmlContent
        });
      } catch (mailErr) {
        console.error(`[${timestamp}] Lỗi gửi email xác nhận cho đơn thủ công:`, mailErr.message);
      }

      const successMsg = `🛒 TẠO ĐƠN HÀNG THỦ CÔNG THÀNH CÔNG!
- Mã đơn hàng: ${orderCode}
- Khách hàng: ${customer.name || email} (${email})
- Sản phẩm: ${order.products?.name || product_name}
- Số tiền: ${Number(amount).toLocaleString('vi-VN')}đ
- Trạng thái đơn: success
- Gửi mail xác nhận: ${emailResult ? '✅ Thành công' : '❌ Thất bại (Xem log)'}`;

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            order,
            email_result: emailResult,
            message: successMsg
          }, null, 2)
        }]
      };

    } catch (error) {
      console.error(`[${timestamp}] Lỗi tool 'create_manual_order':`, error.message);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message,
            message: `❌ Tạo đơn hàng thủ công thất bại: ${error.message}`
          }, null, 2)
        }]
      };
    }
  });

  return server;
};

// Express setup
const app = express();
app.use(express.json());

// Handle POST requests
app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  const timestamp = new Date().toISOString();

  if (sessionId) {
    console.log(`[${timestamp}] Nhận POST request cho session: ${sessionId}`);
  } else {
    console.log(`[${timestamp}] Nhận POST request khởi tạo mới. Request body:`, req.body);
  }

  try {
    let transport;
    if (sessionId && transports[sessionId]) {
      transport = transports[sessionId];
    } else if (!sessionId && req.body && req.body.method === 'initialize') {
      // New initialization request
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
          console.log(`[${new Date().toISOString()}] Session initialized: ${sid}`);
          transports[sid] = transport;
        }
      });

      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && transports[sid]) {
          console.log(`[${new Date().toISOString()}] Đóng transport cho session: ${sid}`);
          delete transports[sid];
        }
      };

      const server = createServer();
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    } else {
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided or invalid method'
        },
        id: null
      });
      return;
    }

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error(`[${timestamp}] Lỗi xử lý POST request:`, error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error'
        },
        id: null
      });
    }
  }
});

// Handle GET requests for SSE streams
app.get('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] || req.query['sessionId'];
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Nhận GET request kết nối SSE cho session: ${sessionId}`);

  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
});

// Handle DELETE requests for session termination
app.delete('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Nhận DELETE request đóng session: ${sessionId}`);

  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  try {
    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error(`[${timestamp}] Lỗi khi đóng session:`, error);
    if (!res.headersSent) {
      res.status(500).send('Error processing session termination');
    }
  }
});

const PORT = 3001;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`[${new Date().toISOString()}] MCP streamable-http server đang chạy tại 127.0.0.1:${PORT}`);
});

process.on('SIGINT', async () => {
  console.log('Đang tắt server...');
  db.close((err) => {
    if (err) console.error(err.message);
    else console.log('Đã đóng kết nối SQLite brain.db');
  });
  
  for (const sid in transports) {
    try {
      await transports[sid].close();
    } catch (e) {
      console.error(e);
    }
  }
  process.exit(0);
});
