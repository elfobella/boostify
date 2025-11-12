# Localhost HTTPS Setup for Google Pay / Apple Pay Testing

## Problem
Google Pay and Apple Pay buttons may not appear on `http://localhost:3000` because these payment methods require HTTPS (even in test mode for some cases).

## Solutions

### Option 1: ngrok (Easiest - Recommended) ⭐

**ngrok** creates a secure HTTPS tunnel to your localhost.

#### Installation:
```bash
# macOS
brew install ngrok

# Or download from https://ngrok.com/download
```

#### Usage:
1. Start your Next.js dev server:
   ```bash
   npm run dev
   ```

2. In a new terminal, run ngrok:
   ```bash
   ngrok http 3000
   ```

3. ngrok will give you a URL like:
   ```
   https://abc123.ngrok.io -> http://localhost:3000
   ```

4. Use the HTTPS URL (https://abc123.ngrok.io) in your browser

5. **Important**: Update Stripe Dashboard for Apple Pay domain verification:
   - Go to Stripe Dashboard → Settings → Payment methods → Apple Pay
   - Add domain: `abc123.ngrok.io` (without https://)
   - Download domain association file
   - The file will be automatically served by ngrok

#### Benefits:
- ✅ Works immediately
- ✅ No certificate setup needed
- ✅ Free tier available
- ✅ Works with Stripe domain verification

#### Note:
- Free ngrok URLs change each time (unless you have a paid plan)
- You'll need to update Stripe Dashboard domain each time

---

### Option 2: mkcert (Local SSL Certificate)

**mkcert** creates locally-trusted SSL certificates for development.

#### Installation:
```bash
# macOS
brew install mkcert

# Install local CA
mkcert -install
```

#### Usage:
1. Create certificates:
   ```bash
   mkcert localhost 127.0.0.1 ::1
   ```

2. This creates:
   - `localhost+2.pem` (certificate)
   - `localhost+2-key.pem` (private key)

3. Update `package.json`:
   ```json
   {
     "scripts": {
       "dev": "next dev --experimental-https --experimental-https-key ./localhost+2-key.pem --experimental-https-cert ./localhost+2.pem"
     }
   }
   ```

4. Start dev server:
   ```bash
   npm run dev
   ```

5. Access: `https://localhost:3000`

#### Benefits:
- ✅ Permanent localhost URL
- ✅ No external service needed
- ✅ Works offline

#### Drawbacks:
- ⚠️ Next.js may not support `--experimental-https` flag
- ⚠️ Requires custom server setup

---

### Option 3: Custom Next.js Server with HTTPS

Create a custom server with HTTPS support.

#### Create `server.js`:
```javascript
const { createServer } = require('https')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

const httpsOptions = {
  key: fs.readFileSync('./localhost+2-key.pem'),
  cert: fs.readFileSync('./localhost+2.pem'),
}

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on https://${hostname}:${port}`)
  })
})
```

#### Update `package.json`:
```json
{
  "scripts": {
    "dev": "node server.js"
  }
}
```

#### Benefits:
- ✅ Full control
- ✅ Works with all Next.js features

---

### Option 4: Deploy to Vercel (Production Testing)

Deploy to Vercel for automatic HTTPS testing.

#### Steps:
1. Push code to GitHub
2. Import to Vercel
3. Deploy automatically gets HTTPS
4. Test Google Pay / Apple Pay on production URL

#### Benefits:
- ✅ Real production environment
- ✅ Automatic HTTPS
- ✅ Works exactly like production

---

## Recommendation

**For quick testing**: Use **ngrok** (Option 1)
- Fastest setup
- Works immediately
- No code changes needed

**For long-term development**: Use **mkcert + Custom Server** (Option 2 + 3)
- Permanent solution
- Works offline
- No external dependencies

---

## Stripe Dashboard Configuration

After setting up HTTPS, update Stripe Dashboard:

1. **Apple Pay Domain Verification**:
   - Stripe Dashboard → Settings → Payment methods → Apple Pay
   - Add your domain (e.g., `abc123.ngrok.io` or `localhost`)
   - Download domain association file
   - Place at: `https://your-domain/.well-known/apple-developer-merchantid-domain-association`
   - For ngrok: This is automatic
   - For localhost: May not work (use ngrok)

2. **Google Pay**:
   - No domain verification needed for test mode
   - Should work automatically with HTTPS

---

## Testing Checklist

- [ ] HTTPS URL accessible
- [ ] Stripe PaymentElement loads
- [ ] Google Pay button appears (Chrome)
- [ ] Apple Pay button appears (Safari)
- [ ] No console errors
- [ ] Payment flow works

---

## Troubleshooting

### "Connection not secure" error
- Install mkcert CA: `mkcert -install`
- Or use ngrok (handles SSL automatically)

### Google Pay still not showing
- Check browser console for errors
- Verify Stripe Dashboard → Payment methods → Google Pay is enabled
- Check PaymentIntent logs for `allowsGooglePay: true`

### Apple Pay domain verification fails
- Use ngrok (automatic)
- Or deploy to Vercel (automatic)
- Localhost domain verification may not work

---

## Quick Start (ngrok)

```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start ngrok
ngrok http 3000

# Use the HTTPS URL from ngrok in your browser
# Example: https://abc123.ngrok.io/clash-royale/boosting
```

Done! 🎉

