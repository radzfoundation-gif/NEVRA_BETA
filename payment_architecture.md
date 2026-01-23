# Payment Architecture & Implementation Guide

## 1. Architecture Overview (Secure Flow)

Instead of relying on the frontend to trigger activation (which is insecure and unreliable), we will use **Midtrans Webhooks** (HTTP Notification) to handle status updates server-to-side.

### Flow:
1.  **Frontend**: User clicks "Subscribe" -> Calls `/api/payment/create-transaction`.
2.  **Backend**: Creates Snap Token -> Returns to Frontend.
3.  **Frontend**: Opens Snap Popup -> User pays.
4.  **Midtrans**:
    *   Redirects user to `finish_redirect_url` (Frontend).
    *   **Simultaneously sends POST request** to `/api/payment/notification` (Backend Webhook).
5.  **Backend Webhook**:
    *   Validates Signature Key.
    *   Checks `transaction_status` (capture/settlement = success).
    *   Updates Supabase `subscriptions` table.
6.  **Frontend**:
    *   User lands on "Payment Success" page.
    *   Polls Supabase for latest subscription status (auto-updates via `useTokenLimit` hook).

## 2. Backend Implementation (`server/index.js`)

You need to add a Notification Handler endpoint.

### Webhook Endpoint (`/api/payment/notification`)

```javascript
const crypto = require('crypto');

app.post('/api/payment/notification', async (req, res) => {
  try {
    const notification = req.body;
    
    // 1. Extract necessary fields
    const { order_id, status_code, gross_amount, transaction_status, signature_key } = notification;

    // 2. Verify Signature (Security)
    // SHA512(order_id + status_code + gross_amount + ServerKey)
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const input = order_id + status_code + gross_amount + serverKey;
    const signature = crypto.createHash('sha512').update(input).digest('hex');

    if (signature !== signature_key) {
      console.error('❌ Invalid Midtrans Signature');
      return res.status(400).json({ status: 'error', message: 'Invalid signature' });
    }

    // 3. Check Status
    let isPaid = false;
    if (transaction_status == 'capture') {
      if (notification.fraud_status == 'challenge') {
        // TODO: Handle challenge
      } else if (notification.fraud_status == 'accept') {
        isPaid = true;
      }
    } else if (transaction_status == 'settlement') {
      isPaid = true;
    }

    // 4. Update Database
    if (isPaid) {
      // Extract userId from order_id (Format: NOIR-AI-PRO-TIMESTAMP-USERIDPART)
      // Note: Typically you should store metadata in custom_field1, but extracting from order_id works if you formatted it that way.
      // Better approach: Pass userId as custom_field_1 during separate create transaction
      
      // For now, let's assume we can fetch the user by order_id or pass userId in custom_field_1
      
      console.log(`✅ Payment success for Order ${order_id}`);
      
      // Update logic here (similar to your activate endpoint)
      // await supabase.from('subscriptions').upsert(...)
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ status: 'error' });
  }
});
```

## 3. Vercel Deployment Checklist

- [ ] **Environment Variables**:
    - `MIDTRANS_SERVER_KEY`: Production Server Key (starts with `Mid-server-`).
    - `VITE_MIDTRANS_CLIENT_KEY`: Production Client Key (starts with `Mid-client-`).
    - `MIDTRANS_IS_PRODUCTION`: `true`.
    - `VITE_APP_URL`: Your Vercel Domain (e.g., `https://noir-ai.com`).
    - `VITE_SUPABASE_URL` & `SUPABASE_SERVICE_KEY`: Your Supabase credentials.

- [ ] **Midtrans Dashboard Configuration**:
    - Login to Midtrans MAP (Production).
    - Go to **Settings > Configuration**.
    - **Notification URL**: `https://your-vercel-domain.com/api/payment/notification`
    - **Finish Redirect URL**: `https://your-vercel-domain.com/` (or specific success page).

- [ ] **Redirect URL Fix**:
    - Ensure your backend uses `process.env.VITE_APP_URL` for `callbacks.finish`.
    - If empty, default to your production domain, NOT localhost.

## 4. Troubleshooting 500 Error on Activate

Your previous error was likely due to `fs.writeFileSync` failing in Vercel's serverless environment (read-only filesystem).
**Fix**: I have removed the file-system backup logic usage. Now it only relies on Supabase, which is the correct architecture for serverless.
