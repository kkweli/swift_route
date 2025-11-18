# 🚀 Deployment Checklist - API Authentication Fix

## ✅ Completed

- [x] Generated secure `INTERNAL_AUTH_SECRET`
- [x] Added secret to local `.env` file
- [x] Updated `vercel.json` routing configuration
- [x] Updated Node.js API to proxy with authentication
- [x] Updated Python handler to verify internal auth
- [x] Created documentation

## 📋 Next Steps

### 1. Add Secret to Vercel

- [ ] Go to https://vercel.com/dashboard
- [ ] Select project: `swift-route`
- [ ] Settings → Environment Variables
- [ ] Add `INTERNAL_AUTH_SECRET` = `4da832e7db3b009e8f10b36aeb242b1acb4597909946245ee7a4a55fbb30b71d`
- [ ] Select all environments (Production, Preview, Development)
- [ ] Save

### 2. Deploy Changes

- [ ] Commit changes to Git:
  ```bash
  git add .
  git commit -m "fix: Add authentication to optimize-route endpoint"
  git push origin main
  ```
- [ ] Wait for Vercel deployment to complete
- [ ] Check deployment logs for errors

### 3. Test Authentication

#### Test with Bearer Token
- [ ] Login to dashboard: https://swift-route-liard.vercel.app/auth
- [ ] Get Bearer token from browser localStorage
- [ ] Test in Postman:
  ```
  POST https://swift-route-liard.vercel.app/api/v1/optimize-route
  Headers:
    Authorization: Bearer YOUR_TOKEN
    Content-Type: application/json
  Body:
    {
      "origin": [-1.2921, 36.8219],
      "destination": [-1.2864, 36.8172],
      "vehicle_type": "car",
      "optimize_for": "time"
    }
  ```
- [ ] Verify response is successful (200 OK)

#### Test with API Key (if you have one)
- [ ] Get API key from dashboard
- [ ] Test in Postman:
  ```
  POST https://swift-route-liard.vercel.app/api/v1/optimize-route
  Headers:
    X-API-Key: YOUR_API_KEY
    Content-Type: application/json
  Body:
    {
      "origin": [-1.2921, 36.8219],
      "destination": [-1.2864, 36.8172]
    }
  ```
- [ ] Verify response is successful (200 OK)

#### Test Unauthorized Access (should fail)
- [ ] Test without auth headers:
  ```
  POST https://swift-route-liard.vercel.app/api/v1/optimize-route
  Headers:
    Content-Type: application/json
  Body:
    {
      "origin": [-1.2921, 36.8219],
      "destination": [-1.2864, 36.8172]
    }
  ```
- [ ] Verify response is 401 UNAUTHORIZED

### 4. Verify Database Logging

- [ ] Go to Supabase dashboard
- [ ] Check `usage_logs` table
- [ ] Verify new entries are created for each request
- [ ] Verify `user_id` and `api_key_id` are populated correctly

### 5. Test Rate Limiting

- [ ] Make multiple requests quickly
- [ ] Verify rate limiting is enforced based on subscription tier
- [ ] Check that trial users are limited appropriately

### 6. Update Documentation

- [ ] Review `docs/API_AUTHENTICATION_FIX.md`
- [ ] Review `docs/SETUP_INTERNAL_AUTH.md`
- [ ] Update any client-facing API documentation
- [ ] Notify B2B clients of any changes (if applicable)

## 🔍 Verification Commands

### Get Bearer Token from Browser
```javascript
// In browser console (while logged into dashboard)
const token = JSON.parse(localStorage.getItem('sb-ttmzicudvdttxespjlsy-auth-token'));
console.log('Bearer Token:', token.access_token);
```

### Test with cURL
```bash
# Replace YOUR_TOKEN with actual token
curl -X POST https://swift-route-liard.vercel.app/api/v1/optimize-route \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "origin": [-1.2921, 36.8219],
    "destination": [-1.2864, 36.8172],
    "vehicle_type": "car",
    "optimize_for": "time"
  }'
```

## 📚 Documentation Files

- `docs/API_AUTHENTICATION_FIX.md` - Complete fix explanation
- `docs/SETUP_INTERNAL_AUTH.md` - Setup guide
- `scripts/generate-secret.js` - Secret generator script
- `.env.example` - Updated with new variable

## 🆘 Troubleshooting

### Still getting UNAUTHORIZED after deployment?

1. Check Vercel environment variables are set
2. Verify deployment completed successfully
3. Check Vercel function logs for errors
4. Ensure Bearer token is not expired
5. Try generating a new token by logging out and back in

### Python handler not receiving requests?

1. Check Vercel logs for proxy errors
2. Verify `INTERNAL_AUTH_SECRET` matches in both Node.js and Python
3. Check routing configuration in `vercel.json`

### Need help?

- Check logs: https://vercel.com/dashboard → Your Project → Deployments → Logs
- Review documentation in `docs/` folder
- Test locally first: `npm run dev` and `npm run dev:api`

## ✨ Success Criteria

You'll know everything is working when:
- ✅ Authenticated requests return route optimization results
- ✅ Unauthenticated requests return 401 UNAUTHORIZED
- ✅ Usage logs are created in database
- ✅ Rate limiting is enforced
- ✅ Both Bearer token and API key authentication work
- ✅ Direct access to internal endpoint is blocked
