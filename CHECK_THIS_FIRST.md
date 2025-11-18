# ⚠️ CHECK THIS FIRST - 401 Error Fix

## The Problem

You're getting 401 errors because **authentication is working correctly** - it's just rejecting invalid credentials.

## Most Likely Causes (in order)

### 1. ❌ INTERNAL_AUTH_SECRET Not Added to Vercel

**This is probably your issue!**

The Node.js API is trying to call the Python handler with an internal auth secret, but if you haven't added it to Vercel, the Python handler rejects the request.

**Fix:**
1. Go to https://vercel.com/dashboard
2. Select your project: `swift-route`
3. Settings → Environment Variables
4. Click "Add New"
5. Name: `INTERNAL_AUTH_SECRET`
6. Value: `4da832e7db3b009e8f10b36aeb242b1acb4597909946245ee7a4a55fbb30b71d`
7. Select ALL environments (Production, Preview, Development)
8. Click Save
9. **Redeploy your app** (push to GitHub or click "Redeploy" in Vercel)

### 2. ❌ Bearer Token is Expired or Invalid

**Get a fresh token:**

1. Open https://swift-route-liard.vercel.app/auth
2. Log in (or log out and log back in)
3. Press F12 (Developer Tools)
4. Go to Console
5. Paste this:
```javascript
const authKey = Object.keys(localStorage).find(k => k.includes('auth-token'));
const authData = JSON.parse(localStorage.getItem(authKey));
console.log('✅ Your Bearer Token:');
console.log(authData.access_token);
console.log('\n📅 Expires:', new Date(authData.expires_at * 1000));
```
6. Copy the token
7. Use in Postman: `Authorization: Bearer [paste_token_here]`

### 3. ❌ Wrong Header Format in Postman

**Correct format:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Common mistakes:**
- ❌ `Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (missing "Bearer ")
- ❌ `Authorization: Bearer: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (extra colon)
- ❌ `Authorisation: Bearer ...` (wrong spelling)
- ❌ Token has line breaks or spaces

## Quick Test

### Test 1: Health Check (No Auth)

```bash
curl https://swift-route-liard.vercel.app/api/v1/health
```

**Expected:** 200 OK with JSON response

If this fails, the API is down.

### Test 2: With Your Token

```bash
# Replace YOUR_TOKEN_HERE with your actual token
curl -X POST https://swift-route-liard.vercel.app/api/v1/optimize-route \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"origin":[-1.2921,36.8219],"destination":[-1.2864,36.8172],"vehicle_type":"car","optimize_for":"time"}'
```

**Expected:** 200 OK with route data

## Postman Setup (Step by Step)

### 1. Create New Request

- Method: `POST`
- URL: `https://swift-route-liard.vercel.app/api/v1/optimize-route`

### 2. Add Headers

Click "Headers" tab, add these:

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `Content-Type` | `application/json` |

### 3. Add Body

- Select "Body" tab
- Select "raw"
- Select "JSON" from dropdown
- Paste:

```json
{
  "origin": [-1.2921, 36.8219],
  "destination": [-1.2864, 36.8172],
  "vehicle_type": "car",
  "optimize_for": "time"
}
```

### 4. Send Request

Click "Send"

**Expected Response:**
```json
{
  "data": {
    "baseline_route": { ... },
    "optimized_route": { ... },
    "improvements": { ... }
  }
}
```

## Still Getting 401?

### Checklist:

- [ ] Added `INTERNAL_AUTH_SECRET` to Vercel environment variables
- [ ] Redeployed after adding environment variable
- [ ] Got fresh Bearer token (logged out and back in)
- [ ] Token starts with `eyJ` and is very long
- [ ] Header is `Authorization: Bearer [token]` (with space after Bearer)
- [ ] Content-Type is `application/json`
- [ ] Body is valid JSON
- [ ] Using POST method (not GET)
- [ ] URL is correct: `/api/v1/optimize-route` (not `/internal`)

## Debug: Check Vercel Logs

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click "Deployments"
4. Click latest deployment
5. Click "Functions" tab
6. Look for `api/index.js` logs
7. Check for errors

## Need More Help?

1. Open `scripts/get-auth-token.html` in browser (while logged into dashboard)
2. Read `docs/POSTMAN_TROUBLESHOOTING.md` for detailed guide
3. Check `docs/API_AUTHENTICATION_FIX.md` for technical details

## The Real Issue

Based on your error, the authentication layer IS working. The 401 means:
- ✅ Your code changes are deployed
- ✅ The routing is correct
- ✅ Authentication is being checked
- ❌ Your credentials are invalid/expired/missing

**Most likely:** You need to add `INTERNAL_AUTH_SECRET` to Vercel and redeploy.
