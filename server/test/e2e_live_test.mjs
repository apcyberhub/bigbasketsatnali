import axios from 'axios';
import assert from 'assert';

async function testLiveE2E() {
  console.log('🚀 Testing Live Full-Stack End-to-End Flow on http://127.0.0.1:5000...');

  // 1. Health check
  const health = await axios.get('http://127.0.0.1:5000/api/health');
  assert.strictEqual(health.data.success, true);
  console.log('✅ 1. Backend Server Healthy (Port 5000)');

  // 2. Fetch Categories & Products
  const categories = await axios.get('http://127.0.0.1:5000/api/categories');
  const products = await axios.get('http://127.0.0.1:5000/api/products');
  assert.ok(categories.data.data.length >= 10);
  assert.ok(products.data.data.length >= 10);
  console.log(`✅ 2. Catalog Live (${categories.data.data.length} categories, ${products.data.data.length} products)`);

  // 3. Customer Login
  const loginRes = await axios.post('http://127.0.0.1:5000/api/auth/login', {
    emailOrPhone: 'customer@bigbasket.local',
    password: 'customer123',
  });
  assert.strictEqual(loginRes.data.success, true);
  const token = loginRes.data.data.token;
  const user = loginRes.data.data.user;
  console.log(`✅ 3. Customer Authentication Verified (${user.name})`);

  // 4. Cart Operations
  const firstProd = products.data.data[0];
  const cartRes = await axios.post(
    'http://127.0.0.1:5000/api/cart/items',
    { productId: firstProd.id, quantity: 2 },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  assert.strictEqual(cartRes.data.success, true);
  console.log(`✅ 4. Shopping Cart Operation Verified (${firstProd.name} x2 in cart)`);

  // 5. Coupon Application
  const couponRes = await axios.post('http://127.0.0.1:5000/api/coupons/validate', {
    code: 'WELCOME20',
    orderAmount: cartRes.data.data.subtotal,
  });
  assert.strictEqual(couponRes.data.success, true);
  console.log(`✅ 5. Coupon Engine Validated (Saved ₹${couponRes.data.data.discountAmount})`);

  // 6. Address & Slot Fetch
  const addrRes = await axios.get('http://127.0.0.1:5000/api/addresses', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const slotRes = await axios.get('http://127.0.0.1:5000/api/delivery-slots');
  const selectedAddress = addrRes.data.data[0];
  const selectedSlot = slotRes.data.data[0].formattedSlot;
  console.log(`✅ 6. Address & Delivery Slot Ready (${selectedAddress.city}, ${selectedSlot})`);

  // 7. Place Atomic COD Order
  const orderRes = await axios.post(
    'http://127.0.0.1:5000/api/orders',
    {
      addressId: selectedAddress.id,
      deliverySlot: selectedSlot,
      couponCode: 'WELCOME20',
      paymentMethod: 'COD',
      notes: 'Please ring bell',
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  assert.strictEqual(orderRes.data.success, true);
  const order = orderRes.data.data;
  console.log(`✅ 7. Real Atomic Order Placed (Order #${order.orderNumber}, Total: ₹${order.total})`);

  // 8. Admin Login & Dashboard Analytics
  const adminLogin = await axios.post('http://127.0.0.1:5000/api/auth/login', {
    emailOrPhone: 'admin@bigbasket.local',
    password: 'admin123',
  });
  const adminToken = adminLogin.data.data.token;
  const adminDash = await axios.get('http://127.0.0.1:5000/api/admin/dashboard', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.strictEqual(adminDash.data.success, true);
  console.log(`✅ 8. Admin Analytics Live (Total Revenue: ₹${adminDash.data.data.metrics.totalRevenue})`);

  // 9. Admin Order Status Update
  const updateStatus = await axios.put(
    `http://127.0.0.1:5000/api/admin/orders/${order.id}/status`,
    { orderStatus: 'PACKED' },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  assert.strictEqual(updateStatus.data.success, true);
  console.log(`✅ 9. Admin Live Status Update (Order #${order.orderNumber} -> PACKED)`);

  // 10. Frontend Availability
  const viteIndex = await axios.get('http://127.0.0.1:5173');
  assert.strictEqual(viteIndex.status, 200);
  assert.ok(viteIndex.data.includes('Big Basket'));
  console.log('✅ 10. Frontend React + Vite Dev Server Verified (Port 5173)');

  console.log('\n🎉 ALL 10 FULL-STACK END-TO-END INTEGRATION CHECKS PASSED PERFECTLY!');
}

testLiveE2E().catch((err) => {
  console.error('❌ E2E Failed:', err);
  process.exit(1);
});
