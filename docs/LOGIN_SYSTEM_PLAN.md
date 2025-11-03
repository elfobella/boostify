# Login System Plan - Boostify

## Amaç
Modern, güvenli ve kullanıcı dostu bir authentication sistemi kurmak. Discord ve Google OAuth ile giriş yapma özellikleri.

## Authentication Yöntemleri

### 1. **Discord OAuth**
- Discord'un resmi OAuth 2.0 API'si
- Küresel olarak yaygın kullanım
- Oyun topluluğunda çok popüler
- Profil fotoğrafı, kullanıcı adı, email bilgileri

### 2. **Google OAuth**
- En yaygın ve güvenilir OAuth sağlayıcılarından biri
- Kullanıcı dostu
- Geniş kullanıcı tabanı
- Ek güvenlik katmanları

### 3. **Email/Password (Opsiyonel - Gelecek)**
- Gelecekte eklenebilir
- Şimdilik OAuth ile başlayacağız

## Teknoloji Stack

### Önerilen Paketler

#### 1. **NextAuth.js v5** (Auth.js)
- Next.js için resmi authentication çözümü
- TypeScript desteği
- Middleware ile kolay route protection
- OAuth provider'lar için native desteği
- Session management
- JWT veya database session
- **Package**: `next-auth@beta` veya `auth`

#### 2. **Database (Opsiyonel)**
- PostgreSQL/SQLite (Vercel Postgres, Supabase)
- Kullanıcı bilgileri ve session'ları saklamak için
- İlk aşamada database olmadan başlayabiliriz (JWT)

#### 3. **UI Components**
- Modal: `Radix UI Dialog` veya `headlessui`
- Tasarıma uygun custom modal
- Dark mode uyumlu

## UI/UX Tasarım

### Login Modal

#### Layout
```
┌─────────────────────────────────────┐
│         BOOSTIFY                    │
│         Welcome Back!               │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Continue with Discord      │   │
│  │  [Discord Icon]             │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Continue with Google       │   │
│  │  [Google Icon]              │   │
│  └─────────────────────────────┘   │
│                                     │
│  By continuing, you agree to...    │
│                                     │
│  [X Close]                          │
└─────────────────────────────────────┘
```

#### Modal Özellikleri
- **Backdrop**: Koyu, blur efektli overlay
- **Modal**: Dark theme uyumlu, rounded corners
- **Buttons**: Gradient background (blue-cyan)
- **Icons**: Lucide React icons
- **Animation**: Fade-in, scale animation
- **Responsive**: Mobile-friendly

#### Trigger Button
- Navbar'da "Sign In" butonu
- Sağ üst köşede
- Currency ve Locale selector'ların yanında
- Kullanıcı giriş yaptıysa: Profile dropdown

## Authentication Flow

### 1. OAuth Flow (Discord & Google)
```
User clicks "Login with Discord/Google"
    ↓
Redirect to OAuth provider
    ↓
User authorizes app
    ↓
Provider returns to callback URL
    ↓
NextAuth verifies and creates session
    ↓
User redirected to dashboard/homepage
```

### 2. Session Management
- JWT-based sessions (ilk aşama)
- Secure HTTP-only cookies
- Refresh token mechanism
- Auto-logout on expiry

### 3. User Data Storage
```typescript
interface User {
  id: string
  name: string
  email: string
  image: string
  provider: 'discord' | 'google'
  createdAt: Date
}
```

## Implementation Steps

### Phase 1: Setup & Configuration
1. ✅ Install NextAuth.js v5
2. ✅ Setup environment variables
3. ✅ Configure OAuth providers (Discord & Google)
4. ✅ Create API route `/api/auth/[...nextauth]`

### Phase 2: UI Components
1. ✅ Create Login Modal component
2. ✅ Create provider buttons (Discord, Google)
3. ✅ Add animation and styling
4. ✅ Make responsive
5. ✅ Add to Navbar as trigger

### Phase 3: Authentication Logic
1. ✅ Configure NextAuth with Discord provider
2. ✅ Configure NextAuth with Google provider
3. ✅ Setup session strategy
4. ✅ Create middleware for protected routes

### Phase 4: User Profile (Optional)
1. ✅ Create user profile dropdown
2. ✅ Show user info (name, avatar)
3. ✅ Add logout functionality
4. ✅ Add account settings (future)

### Phase 5: Protected Routes
1. ✅ Identify protected routes
2. ✅ Add middleware protection
3. ✅ Create dashboard/homepage for logged-in users
4. ✅ Redirect logic

## File Structure

```
app/
├── api/
│   └── auth/
│       └── [...nextauth]/
│           └── route.ts          # NextAuth API route
├── components/
│   ├── auth/
│   │   ├── LoginModal.tsx        # Main login modal
│   │   ├── AuthButton.tsx        # Provider buttons
│   │   ├── UserMenu.tsx          # Profile dropdown
│   │   └── index.ts
│   └── navbar/
│       └── ... (updated with auth button)
├── middleware.ts                  # Route protection
└── (auth)/
    └── dashboard/
        └── page.tsx               # Protected dashboard
```

## Environment Variables

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generated-secret>

# Discord OAuth
DISCORD_CLIENT_ID=<your-discord-client-id>
DISCORD_CLIENT_SECRET=<your-discord-client-secret>

# Google OAuth
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

## Discord OAuth Setup

### Steps
1. Go to https://discord.com/developers/applications
2. Create new application
3. Go to "OAuth2" section
4. Add redirect URI: `http://localhost:3000/api/auth/callback/discord`
5. Get Client ID and Client Secret
6. Add to `.env.local`

### Required Scopes
- `identify` - User's username and avatar
- `email` - User's email address

## Google OAuth Setup

### Steps
1. Go to https://console.cloud.google.com/
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Get Client ID and Client Secret
7. Add to `.env.local`

### Required Scopes
- `profile` - Basic profile info
- `email` - User's email

## Security Considerations

### Best Practices
1. **HTTPS**: Production'da mutlaka HTTPS kullan
2. **Secret Key**: Güçlü random secret key
3. **CSRF Protection**: NextAuth otomatik sağlar
4. **Rate Limiting**: API endpoint'lerine rate limit ekle
5. **Cookie Security**: Secure, HTTP-only, SameSite
6. **Session Timeout**: Belirli bir süre sonra otomatik logout

### Data Privacy
- Kullanıcı verilerini GDPR uyumlu sakla
- Minimum gerekli bilgileri topla
- Kullanıcıya privacy policy göster

## User Experience

### Login Modal Animations
```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Scale in */
@keyframes scaleIn {
  from { transform: scale(0.95); }
  to { transform: scale(1); }
}

/* Backdrop blur */
backdrop-filter: blur(8px);
```

### Loading States
- OAuth redirect sırasında loading spinner
- "Connecting to Discord/Google..." mesajı
- Success/Error notifications

### Error Handling
- OAuth fail durumları için error message
- Network error handling
- User-friendly error messages

## Testing

### Test Scenarios
1. ✅ Discord login flow
2. ✅ Google login flow
3. ✅ Session persistence
4. ✅ Logout functionality
5. ✅ Protected route access
6. ✅ Mobile responsiveness
7. ✅ Error handling

### Edge Cases
- Multiple tabs open
- Session expiry
- OAuth provider down
- Network failures
- User denies permission

## Internationalization (i18n)

### Translation Keys
```json
{
  "auth": {
    "signIn": "Sign In",
    "welcomeBack": "Welcome Back!",
    "signInDiscord": "Continue with Discord",
    "signInGoogle": "Continue with Google",
    "signOut": "Sign Out",
    "profile": "Profile",
    "loading": "Connecting...",
    "error": "Authentication failed"
  }
}
```

### Turkish Translations
```json
{
  "auth": {
    "signIn": "Giriş Yap",
    "welcomeBack": "Tekrar Hoş Geldiniz!",
    "signInDiscord": "Discord ile Giriş Yap",
    "signInGoogle": "Google ile Giriş Yap",
    "signOut": "Çıkış Yap",
    "profile": "Profil",
    "loading": "Bağlanıyor...",
    "error": "Giriş başarısız"
  }
}
```

## Deployment Considerations

### Production Setup
1. Update `NEXTAUTH_URL` to production domain
2. Add production OAuth redirect URIs
3. Enable HTTPS
4. Setup monitoring and logging
5. Database migration (if using database)

### Vercel Deployment
- Environment variables in Vercel dashboard
- Automatic HTTPS
- Edge runtime support

## Future Enhancements

### Phase 2 Features
1. Email/Password authentication
2. Two-factor authentication (2FA)
3. Social login options (GitHub, Twitter)
4. Profile customization
5. Order history tracking
6. Account settings page

### Analytics
- Login conversion tracking
- Provider usage statistics
- User retention metrics

## Dependencies

```json
{
  "next-auth": "next-auth@beta",
  "@auth/prisma-adapter": "^1.0.0", // Optional: for database
  "@radix-ui/react-dialog": "^1.0.0", // Modal component
  "lucide-react": "^0.263.1" // Icons
}
```

## Estimated Timeline

- **Phase 1**: 2-3 hours (Setup & Configuration)
- **Phase 2**: 3-4 hours (UI Components)
- **Phase 3**: 2-3 hours (Authentication Logic)
- **Phase 4**: 1-2 hours (User Profile)
- **Phase 5**: 1-2 hours (Protected Routes)

**Total**: 9-14 hours

## Success Criteria

✅ User can login with Discord OAuth
✅ User can login with Google OAuth
✅ Session persists across page reloads
✅ Modal is visually appealing and responsive
✅ Logout functionality works
✅ Protected routes are secure
✅ i18n support for auth flows
✅ Error handling is robust
✅ Loading states are clear

