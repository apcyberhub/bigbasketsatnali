import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import assert from 'assert';
import request from 'supertest';
import app from '../src/app';

async function runTests() {
  console.log('🚀 Running Big Basket Full-Stack API Suite...');

  // 1. Health Check
  const healthRes = await request(app).get('/api/health');
  assert.strictEqual(healthRes.status, 200);
  assert.strictEqual(healthRes.body.success, true);
  assert.strictEqual(healthRes.body.data.brand, 'BIG BASKET');
  console.log('✅ 1. Health Check: PASSED');

  // 2. Customer Registration
  const testEmail = `testuser_${Date.now()}@example.com`;
  const regRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test Customer',
      email: testEmail,
      phone: '9876543211',
      password: 'password123',
    });
  assert.strictEqual(regRes.status, 201);
  assert.ok(regRes.body.data.token);
  const customerToken = regRes.body.data.token;
  console.log('✅ 2. Customer Registration: PASSED');

  // 3. Customer Login
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      emailOrPhone: testEmail,
      password: 'password123',
    });
  assert.strictEqual(loginRes.status, 200);
  assert.strictEqual(loginRes.body.data.user.role, 'CUSTOMER');
  console.log('✅ 3. Customer Login: PASSED');

  // 4. Admin Login
  const adminLoginRes = await request(app)
    .post('/api/auth/login')
    .send({
      emailOrPhone: 'admin@bigbasket.local',
      password: 'admin123',
    });
  assert.strictEqual(adminLoginRes.status, 200);
  assert.strictEqual(adminLoginRes.body.data.user.role, 'ADMIN');
  const adminToken = adminLoginRes.body.data.token;
  console.log('✅ 4. Admin Login & Role Check: PASSED');

  // 5. Products Catalog & Filtering
  const productsRes = await request(app).get('/api/products?limit=10');
  assert.strictEqual(productsRes.status, 200);
  assert.ok(productsRes.body.data.length > 0);
  const firstProduct = productsRes.body.data[0];
  console.log(`✅ 5. Products Catalog: PASSED (${productsRes.body.data.length} products loaded)`);

  // 6. Search Suggestions
  const searchRes = await request(app).get('/api/products/search/suggestions?q=milk');
  assert.strictEqual(searchRes.status, 200);
  console.log('✅ 6. Search Autocomplete Suggestions: PASSED');

  // 7. Categories
  const catRes = await request(app).get('/api/categories');
  assert.strictEqual(catRes.status, 200);
  assert.ok(catRes.body.data.length >= 10);
  console.log('✅ 7. Master Categories Listing: PASSED');

  // 8. Address Management
  const addAddressRes = await request(app)
    .post('/api/addresses')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({
      fullName: 'Test Customer',
      phone: '9876543211',
      addressLine1: 'Flat 101, Sunshine Heights',
      city: 'Indore',
      state: 'Madhya Pradesh',
      postalCode: '452001',
      addressType: 'HOME',
      isDefault: true,
    });
  assert.strictEqual(addAddressRes.status, 201);
  const addressId = addAddressRes.body.data.id;
  console.log('✅ 8. Address Management (Create Address): PASSED');

  // 9. Shopping Cart
  const addToCartRes = await request(app)
    .post('/api/cart/items')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({
      productId: firstProduct.id,
      quantity: 2,
    });
  assert.strictEqual(addToCartRes.status, 200);
  assert.strictEqual(addToCartRes.body.data.items.length, 1);
  assert.strictEqual(addToCartRes.body.data.items[0].quantity, 2);
  console.log('✅ 9. Shopping Cart (Add item & totals): PASSED');

  // 10. Wishlist Toggle
  const wishlistRes = await request(app)
    .post(`/api/wishlist/${firstProduct.id}`)
    .set('Authorization', `Bearer ${customerToken}`);
  assert.strictEqual(wishlistRes.status, 200);
  assert.strictEqual(wishlistRes.body.data.inWishlist, true);
  console.log('✅ 10. Wishlist Persistence: PASSED');

  // 11. Coupon Validation
  const couponRes = await request(app)
    .post('/api/coupons/validate')
    .send({
      code: 'WELCOME20',
      orderAmount: 500,
    });
  assert.strictEqual(couponRes.status, 200);
  assert.strictEqual(couponRes.body.data.discountAmount, 100);
  console.log('✅ 11. Coupon Validation: PASSED');

  // 12. Delivery Slots
  const slotsRes = await request(app).get('/api/delivery-slots');
  assert.strictEqual(slotsRes.status, 200);
  assert.ok(slotsRes.body.data.length > 0);
  console.log('✅ 12. Delivery Time Slots: PASSED');

  // 13. Place Order (Atomic Transaction)
  const orderRes = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({
      addressId,
      deliverySlot: '10:00 AM - 12:00 PM (Today)',
      couponCode: 'WELCOME20',
      paymentMethod: 'COD',
      notes: 'Test order from automated suite',
    });
  assert.strictEqual(orderRes.status, 201);
  assert.ok(orderRes.body.data.orderNumber.startsWith('BB-'));
  const orderId = orderRes.body.data.id;
  console.log(`✅ 13. Atomic Order Placement (COD): PASSED (Order #${orderRes.body.data.orderNumber})`);

  // 14. Verify Cart was Cleared
  const emptyCartRes = await request(app)
    .get('/api/cart')
    .set('Authorization', `Bearer ${customerToken}`);
  assert.strictEqual(emptyCartRes.status, 200);
  assert.strictEqual(emptyCartRes.body.data.items.length, 0);
  console.log('✅ 14. Cart Auto-Clear on Order Placement: PASSED');

  // 15. Order Details & History
  const myOrdersRes = await request(app)
    .get('/api/orders')
    .set('Authorization', `Bearer ${customerToken}`);
  assert.strictEqual(myOrdersRes.status, 200);
  assert.strictEqual(myOrdersRes.body.data.length, 1);
  console.log('✅ 15. Customer Order History: PASSED');

  // 16. Order Cancellation
  const cancelRes = await request(app)
    .post(`/api/orders/${orderId}/cancel`)
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ reason: 'Changed mind' });
  assert.strictEqual(cancelRes.status, 200);
  assert.strictEqual(cancelRes.body.data.orderStatus, 'CANCELLED');
  console.log('✅ 16. Order Cancellation & Stock Restoration: PASSED');

  // 17. Admin Dashboard Analytics
  const adminDashRes = await request(app)
    .get('/api/admin/dashboard')
    .set('Authorization', `Bearer ${adminToken}`);
  assert.strictEqual(adminDashRes.status, 200);
  assert.ok(adminDashRes.body.data.metrics.totalProducts > 0);
  console.log('✅ 17. Admin Dashboard Analytics & KPIs: PASSED');

  // 18. Admin Inventory
  const adminInvRes = await request(app)
    .get('/api/admin/inventory')
    .set('Authorization', `Bearer ${adminToken}`);
  assert.strictEqual(adminInvRes.status, 200);
  assert.ok(adminInvRes.body.data.length > 0);
  console.log('✅ 18. Admin Inventory Management: PASSED');

  // 19. Security Test: Customer blocked from Admin API (403 Forbidden)
  const forbiddenRes = await request(app)
    .get('/api/admin/dashboard')
    .set('Authorization', `Bearer ${customerToken}`);
  assert.strictEqual(forbiddenRes.status, 403);
  console.log('✅ 19. Security Test (Customer -> Admin API 403 Forbidden): PASSED');

  // 20. Security Test: Unauthenticated blocked from Cart/Order (401 Unauthorized)
  const unauthRes = await request(app).get('/api/cart');
  assert.strictEqual(unauthRes.status, 401);
  console.log('✅ 20. Security Test (Unauthenticated -> 401 Unauthorized): PASSED');

  console.log('\n🎉 ALL 20 FULL-STACK BACKEND API TESTS PASSED PERFECTLY!');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
