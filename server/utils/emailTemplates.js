const welcomeTemplate = ({ name }) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 8px; overflow: hidden; }
  .header { background: #2e7d32; padding: 30px; text-align: center; }
  .header h1 { color: #fff; margin: 0; }
  .body { padding: 30px; }
  .body p { color: #555; line-height: 1.6; }
  .btn { display: inline-block; background: #2e7d32; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; margin-top: 20px; font-weight: bold; }
  .footer { background: #f9f9f9; padding: 16px; text-align: center; font-size: 12px; color: #999; }
</style></head>
<body>
  <div class="container">
    <div class="header"><h1>GroceryShop</h1></div>
    <div class="body">
      <h2>Welcome, ${name}!</h2>
      <p>Thank you for joining GroceryShop. Your account is ready.</p>
      <p>Start exploring fresh groceries delivered right to your door.</p>
      <a href="${process.env.CLIENT_URL}/shop" class="btn">Start Shopping</a>
    </div>
    <div class="footer">GroceryShop. All rights reserved.</div>
  </div>
</body></html>`;

const orderConfirmationTemplate = ({ name, orderNumber, items, grandTotal, deliveryAddress }) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; background: #f4f4f4; }
  .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 8px; overflow: hidden; }
  .header { background: #2e7d32; padding: 30px; text-align: center; }
  .header h1 { color: #fff; margin: 0; }
  .body { padding: 30px; }
  .order-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #2e7d32; color: #fff; padding: 10px; text-align: left; font-size: 13px; }
  td { padding: 10px; border-bottom: 1px solid #eee; font-size: 13px; color: #444; }
  .total-row td { font-weight: bold; color: #2e7d32; }
  .footer { background: #f9f9f9; padding: 16px; text-align: center; font-size: 12px; color: #999; }
</style></head>
<body>
  <div class="container">
    <div class="header"><h1>Order Confirmed!</h1></div>
    <div class="body">
      <p>Hi <strong>${name}</strong>, your order has been placed successfully.</p>
      <div class="order-box">
        <strong>Order Number:</strong> #${orderNumber}<br/>
        <strong>Delivery Address:</strong> ${deliveryAddress}
      </div>
      <table>
        <tr><th>Item</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>
        ${items.map(i => "<tr><td>" + i.product_name + "</td><td>" + i.quantity + "</td><td>Rs." + i.unit_price + "</td><td>Rs." + i.subtotal + "</td></tr>").join('')}
        <tr class="total-row"><td colspan="3">Grand Total</td><td>Rs.${grandTotal}</td></tr>
      </table>
    </div>
    <div class="footer">GroceryShop. All rights reserved.</div>
  </div>
</body></html>`;

const orderStatusTemplate = ({ name, orderNumber, status }) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;">
  <div style="max-width:600px;margin:30px auto;background:#fff;padding:30px;border-radius:8px;">
    <h2 style="color:#2e7d32;">GroceryShop - Order Update</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>Your order <strong>#${orderNumber}</strong> status has been updated to:</p>
    <p><span style="background:#2e7d32;color:#fff;padding:8px 18px;border-radius:20px;font-weight:bold;">${status.replace(/_/g, ' ')}</span></p>
    <p>Thank you for shopping with GroceryShop!</p>
  </div>
</body></html>`;

module.exports = { welcomeTemplate, orderConfirmationTemplate, orderStatusTemplate };
