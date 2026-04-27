import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Send order completion email to student
export const sendOrderCompletionEmail = async (order) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"E-Canteen" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: order.customerEmail,
      subject: `Your Order #${order.orderNumber} is Ready for Pickup! 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .item:last-child { border-bottom: none; }
            .total { font-size: 1.2em; font-weight: bold; color: #1d4ed8; margin-top: 15px; }
            .pickup-info { background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🍽️ Order Ready!</h1>
              <p>Your order is ready for pickup</p>
            </div>
            <div class="content">
              <p>Hi <strong>${order.customerName}</strong>,</p>
              <p>Great news! Your order <strong>#${order.orderNumber}</strong> has been completed and is ready for pickup at the E-Canteen.</p>
              
              <div class="pickup-info">
                <h3>📍 Pickup Details</h3>
                <p><strong>Date:</strong> ${new Date(order.pickupDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Time:</strong> ${order.pickupTime}</p>
                <p><strong>Location:</strong> University E-Canteen Counter</p>
              </div>
              
              <div class="order-details">
                <h3>🧾 Order Summary</h3>
                ${order.items.map(item => `
                  <div class="item">
                    <strong>${item.name}</strong> x${item.quantity}
                    <span style="float: right;">Rs. ${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                `).join('')}
                <div class="total">
                  Total: Rs. ${order.totalAmount.toFixed(2)}
                </div>
              </div>
              
              <p>Please bring your <strong>Student ID</strong> and mention your order number at the counter.</p>
              <p>Thank you for using E-Canteen! 🙏</p>
            </div>
            <div class="footer">
              <p>E-Canteen - University Food Ordering System</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hi ${order.customerName},

Great news! Your order #${order.orderNumber} has been completed and is ready for pickup at the E-Canteen.

PICKUP DETAILS:
Date: ${new Date(order.pickupDate).toLocaleDateString()}
Time: ${order.pickupTime}
Location: University E-Canteen Counter

ORDER SUMMARY:
${order.items.map(item => `• ${item.name} x${item.quantity} - Rs. ${(item.price * item.quantity).toFixed(2)}`).join('\n')}

Total: Rs. ${order.totalAmount.toFixed(2)}

Please bring your Student ID and mention your order number at the counter.

Thank you for using E-Canteen!
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Order completion email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send order completion email:', error.message);
    return { success: false, error: error.message };
  }
};

// Send order confirmation email to student
export const sendOrderConfirmationEmail = async (order) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"E-Canteen" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: order.customerEmail,
      subject: `Order Confirmed #${order.orderNumber} - E-Canteen`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .item:last-child { border-bottom: none; }
            .total { font-size: 1.2em; font-weight: bold; color: #059669; margin-top: 15px; }
            .pickup-info { background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Order Confirmed!</h1>
              <p>Thank you for your order</p>
            </div>
            <div class="content">
              <p>Hi <strong>${order.customerName}</strong>,</p>
              <p>Your order <strong>#${order.orderNumber}</strong> has been confirmed and is being prepared.</p>
              
              <div class="pickup-info">
                <h3>📍 Scheduled Pickup</h3>
                <p><strong>Date:</strong> ${new Date(order.pickupDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Time:</strong> ${order.pickupTime}</p>
              </div>
              
              <div class="order-details">
                <h3>🧾 Order Details</h3>
                ${order.items.map(item => `
                  <div class="item">
                    <strong>${item.name}</strong> x${item.quantity}
                    <span style="float: right;">Rs. ${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                `).join('')}
                <div class="total">
                  Total Paid: Rs. ${order.totalAmount.toFixed(2)}
                </div>
              </div>
              
              <p>We'll notify you when your order is ready for pickup!</p>
            </div>
            <div class="footer">
              <p>E-Canteen - University Food Ordering System</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send order confirmation email:', error.message);
    return { success: false, error: error.message };
  }
};

export default {
  sendOrderCompletionEmail,
  sendOrderConfirmationEmail,
};
