# Boostify - TODO List

## 🔥 Priority Tasks

### 1. OAuth Key Configuration ⚠️
- [ ] Discord OAuth credentials ekle
  - [ ] Discord Developer Portal'da application oluştur
  - [ ] Client ID ve Client Secret al
  - [ ] Redirect URI: `http://localhost:3000/api/auth/callback/discord`
  - [ ] `.env.local` dosyasına ekle
- [ ] Google OAuth credentials ekle
  - [ ] Google Cloud Console'da project oluştur
  - [ ] OAuth 2.0 credentials oluştur
  - [ ] Redirect URI: `http://localhost:3000/api/auth/callback/google`
  - [ ] `.env.local` dosyasına ekle
- [ ] Test authentication flow

**Files to update:**
- `.env.local`

**Resources:**
- Discord Developer Portal: https://discord.com/developers/applications
- Google Cloud Console: https://console.cloud.google.com/

---

### 2. Stripe Integration 🔴
- [ ] Stripe dependencies install
  - [ ] `stripe` package
  - [ ] `@stripe/stripe-js` package
- [ ] Environment variables ekle
  - [ ] `STRIPE_PUBLISHABLE_KEY`
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `STRIPE_WEBHOOK_SECRET` (for production)
- [ ] Stripe API route oluştur
  - [ ] `/api/create-payment-intent`
  - [ ] `/api/webhook` (Stripe events için)
- [ ] Payment component oluştur
  - [ ] Checkout form
  - [ ] Payment method selection
  - [ ] Success/Error handling
- [ ] Boosting service ile entegre et
- [ ] Test Stripe checkout flow

**Files to create:**
- `app/api/create-payment-intent/route.ts`
- `app/api/webhook/route.ts`
- `app/components/payment/PaymentForm.tsx`
- `app/components/payment/CheckoutButton.tsx`

**Files to update:**
- `.env.local`
- `app/components/boosting/BoostingForm.tsx`
- `lib/pricing.ts`

**Resources:**
- Stripe Docs: https://stripe.com/docs
- Stripe Test Cards: https://stripe.com/docs/testing

---

### 3. Boosting Checkout Page Fix 🟡
- [ ] Mevcut checkout akışını incele
- [ ] Form validation ekle
  - [ ] Required fields check
  - [ ] Input format validation (trophy amount, etc.)
  - [ ] Error messages (i18n)
- [ ] Price calculation kontrolü
  - [ ] Currency conversion düzgün çalışıyor mu?
  - [ ] Estimated time hesaplaması doğru mu?
  - [ ] Service-specific pricing
- [ ] Checkout button improvement
  - [ ] Loading state
  - [ ] Disabled state (invalid form)
  - [ ] Success/Error feedback
- [ ] Order summary component
  - [ ] Service details
  - [ ] Price breakdown
  - [ ] Estimated completion time

**Files to update:**
- `app/components/boosting/BoostingForm.tsx`
- `app/clash-royale/boosting/page.tsx`
- `lib/pricing.ts`

---

### 4. Pricing System Overhaul 🟡
- [ ] Mevcut pricing logic'i gözden geçir
- [ ] Currency conversion sistemi düzelt
  - [ ] Real-time exchange rates
  - [ ] Rate caching
  - [ ] Fallback rates
- [ ] Service-specific pricing
  - [ ] Trophy boosting pricing (per trophy)
  - [ ] Path of Legends pricing
  - [ ] UC Medals pricing
  - [ ] Other services
- [ ] Pricing display component
  - [ ] Price per unit
  - [ ] Total price calculation
  - [ ] Currency symbol formatting
  - [ ] Discount system (optional)
- [ ] Pricing table component
  - [ ] Service comparison
  - [ ] Popular packages
  - [ ] "Best Value" highlights

**Files to update:**
- `lib/pricing.ts`
- `contexts/CurrencyContext.tsx`
- `app/components/boosting/BoostingForm.tsx`

**Files to create:**
- `app/components/pricing/PricingTable.tsx`
- `app/components/pricing/PriceDisplay.tsx`
- `lib/exchange-rates.ts`

---

## 🎯 Future Enhancements

### User Dashboard
- [ ] User profile page
- [ ] Order history
- [ ] Active orders tracking
- [ ] Support tickets
- [ ] Account settings

### Additional Games
- [ ] League of Legends boosting
- [ ] Valorant boosting
- [ ] PUBG Mobile boosting
- [ ] Game-specific pricing

### Features
- [ ] Order tracking system
- [ ] Email notifications
- [ ] Live chat support
- [ ] Referral program
- [ ] Loyalty rewards

### SEO & Marketing
- [ ] Meta tags optimization
- [ ] Open Graph tags
- [ ] Sitemap generation
- [ ] Analytics integration (Google Analytics)
- [ ] Social media integration

---

## 📝 Notes

### Current Status
- ✅ Project structure complete
- ✅ Dark mode implemented
- ✅ i18n (EN/TR) working
- ✅ Multi-currency support
- ✅ Typography system in place
- ✅ Login system (UI complete, needs OAuth keys)
- ⚠️ Stripe integration pending
- ⚠️ Pricing system needs review
- ⚠️ Checkout flow needs improvements

### Environment Variables Needed
```env
# OAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generated>
DISCORD_CLIENT_ID=<required>
DISCORD_CLIENT_SECRET=<required>
GOOGLE_CLIENT_ID=<required>
GOOGLE_CLIENT_SECRET=<required>

# Stripe
STRIPE_PUBLISHABLE_KEY=<required>
STRIPE_SECRET_KEY=<required>
STRIPE_WEBHOOK_SECRET=<optional-for-now>

# Optional
EXCHANGE_RATE_API_KEY=<optional>
```

### Testing Checklist
- [ ] Login with Discord
- [ ] Login with Google
- [ ] Form validation
- [ ] Price calculation
- [ ] Currency conversion
- [ ] Stripe checkout flow
- [ ] Webhook handling
- [ ] Mobile responsiveness
- [ ] i18n accuracy
- [ ] Dark mode consistency

---

## 🐛 Known Issues
- Modal centering was fixed ✅
- NextAuth error resolved ✅
- Checkout form needs validation
- Pricing calculations may need adjustments
- Stripe integration pending

---

## 📅 Timeline

### Week 1
- OAuth key configuration
- Basic Stripe setup
- Checkout improvements

### Week 2
- Pricing system overhaul
- Order management
- Testing & bug fixes

### Week 3
- Additional features
- User dashboard
- Polish & optimizations

