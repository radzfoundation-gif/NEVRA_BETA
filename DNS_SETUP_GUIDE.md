# DNS Configuration Guide for Clerk + rlabs-studio.cloud

## 📋 CNAME Records to Add

Anda perlu menambahkan 5 CNAME records berikut ke DNS provider Anda (misalnya Cloudflare, Namecheap, GoDaddy, dll):

### 1. Frontend API (REQUIRED)
```
Type: CNAME
Name: clerk
Value: frontend-api.clerk.services
TTL: Auto / 3600
```
**Result**: `clerk.rlabs-studio.cloud` → `frontend-api.clerk.services`

---

### 2. Account Portal (REQUIRED)
```
Type: CNAME
Name: accounts
Value: accounts.clerk.services
TTL: Auto / 3600
```
**Result**: `accounts.rlabs-studio.cloud` → `accounts.clerk.services`

---

### 3. Email Domain (REQUIRED)
```
Type: CNAME
Name: clkmail
Value: mail.wat96zhra5wr.clerk.services
TTL: Auto / 3600
```
**Result**: `clkmail.rlabs-studio.cloud` → `mail.wat96zhra5wr.clerk.services`

---

### 4. DKIM Record 1 (Email Authentication)
```
Type: CNAME
Name: clk._domainkey
Value: dkim1.wat96zhra5wr.clerk.services
TTL: Auto / 3600
```
**Result**: `clk._domainkey.rlabs-studio.cloud` → `dkim1.wat96zhra5wr.clerk.services`

---

### 5. DKIM Record 2 (Email Authentication)
```
Type: CNAME
Name: clk2._domainkey
Value: dkim2.wat96zhra5wr.clerk.services
TTL: Auto / 3600
```
**Result**: `clk2._domainkey.rlabs-studio.cloud` → `dkim2.wat96zhra5wr.clerk.services`

---

## 🔧 Step-by-Step Setup

### If Using Cloudflare:

1. **Login to Cloudflare Dashboard**
   - Go to [dash.cloudflare.com](https://dash.cloudflare.com)
   - Select domain: `rlabs-studio.cloud`

2. **Navigate to DNS Settings**
   - Click on **DNS** tab
   - Click **Add record** button

3. **Add Each CNAME Record**
   
   **Record 1 - Frontend API:**
   - Type: `CNAME`
   - Name: `clerk`
   - Target: `frontend-api.clerk.services`
   - Proxy status: ⚠️ **DNS only** (turn OFF orange cloud)
   - TTL: `Auto`
   - Click **Save**

   **Record 2 - Accounts:**
   - Type: `CNAME`
   - Name: `accounts`
   - Target: `accounts.clerk.services`
   - Proxy status: ⚠️ **DNS only** (turn OFF orange cloud)
   - TTL: `Auto`
   - Click **Save**

   **Record 3 - Email:**
   - Type: `CNAME`
   - Name: `clkmail`
   - Target: `mail.wat96zhra5wr.clerk.services`
   - Proxy status: ⚠️ **DNS only** (turn OFF orange cloud)
   - TTL: `Auto`
   - Click **Save**

   **Record 4 - DKIM 1:**
   - Type: `CNAME`
   - Name: `clk._domainkey`
   - Target: `dkim1.wat96zhra5wr.clerk.services`
   - Proxy status: ⚠️ **DNS only** (turn OFF orange cloud)
   - TTL: `Auto`
   - Click **Save**

   **Record 5 - DKIM 2:**
   - Type: `CNAME`
   - Name: `clk2._domainkey`
   - Target: `dkim2.wat96zhra5wr.clerk.services`
   - Proxy status: ⚠️ **DNS only** (turn OFF orange cloud)
   - TTL: `Auto`
   - Click **Save**

---

### If Using Other DNS Providers:

#### **Namecheap:**
1. Login → Domain List → Manage
2. Advanced DNS tab
3. Add New Record → CNAME Record
4. Enter Host and Value as shown above

#### **GoDaddy:**
1. Login → My Products → DNS
2. Add → CNAME
3. Enter Name and Points to

#### **cPanel:**
1. Login to cPanel
2. Zone Editor
3. Add CNAME Record

---

## ⚠️ Important Notes

### 1. Proxy Status (Cloudflare Users)
**CRITICAL**: Turn OFF Cloudflare proxy (orange cloud) for all Clerk CNAME records!
- ❌ Proxied (orange cloud) = Will NOT work
- ✅ DNS only (gray cloud) = Correct

### 2. DNS Propagation Time
- Changes may take **5-60 minutes** to propagate
- Some providers: up to 24 hours
- Check status in Clerk Dashboard

### 3. Verification
After adding records:
1. Wait 10-15 minutes
2. Go back to Clerk Dashboard
3. Click **Verify** button next to each record
4. All should show green checkmark ✅

---

## 🧪 Testing DNS Records

### Using Command Line:

**Windows (PowerShell):**
```powershell
nslookup clerk.rlabs-studio.cloud
nslookup accounts.rlabs-studio.cloud
nslookup clkmail.rlabs-studio.cloud
```

**Mac/Linux:**
```bash
dig clerk.rlabs-studio.cloud CNAME
dig accounts.rlabs-studio.cloud CNAME
dig clkmail.rlabs-studio.cloud CNAME
```

### Using Online Tools:
- [dnschecker.org](https://dnschecker.org)
- [whatsmydns.net](https://www.whatsmydns.net)

---

## 📝 Quick Copy-Paste Table

| Name | Type | Value | Proxy |
|------|------|-------|-------|
| `clerk` | CNAME | `frontend-api.clerk.services` | DNS only |
| `accounts` | CNAME | `accounts.clerk.services` | DNS only |
| `clkmail` | CNAME | `mail.wat96zhra5wr.clerk.services` | DNS only |
| `clk._domainkey` | CNAME | `dkim1.wat96zhra5wr.clerk.services` | DNS only |
| `clk2._domainkey` | CNAME | `dkim2.wat96zhra5wr.clerk.services` | DNS only |

---

## 🔍 Troubleshooting

### Records Not Verifying?
1. ✅ Check proxy is OFF (Cloudflare)
2. ✅ Wait 15-30 minutes for propagation
3. ✅ Verify exact spelling (no typos)
4. ✅ Check TTL is set correctly
5. ✅ Clear DNS cache: `ipconfig /flushdns` (Windows)

### Still Having Issues?
- Contact your DNS provider support
- Check Clerk documentation: [clerk.com/docs/deployments/custom-domain](https://clerk.com/docs/deployments/custom-domain)

---

## ✅ After DNS Verification

Once all 5 records are verified in Clerk Dashboard:

1. **Update Clerk Settings**
   - Go to Clerk Dashboard → Paths
   - Set custom domain URLs

2. **Update Your App**
   - No code changes needed!
   - Clerk will automatically use custom domain

3. **Test Authentication**
   - Sign-in will use: `accounts.rlabs-studio.cloud`
   - Emails will come from: `@clkmail.rlabs-studio.cloud`

---

## 🎉 Benefits of Custom Domain

- ✅ Professional branded URLs
- ✅ Better email deliverability
- ✅ Improved user trust
- ✅ Consistent branding
- ✅ No "clerk.com" in URLs
