#!/bin/bash

# ngrok ile HTTPS tüneli başlatma scripti

echo "🚀 ngrok HTTPS tüneli başlatılıyor..."
echo ""
echo "Not: Next.js sunucusunun çalıştığından emin olun (npm run dev)"
echo ""
echo "⚠️  Free plan kullanıyorsanız, tarayıcıda 'Visit Site' butonuna tıklamanız gerekecek"
echo ""

# PATH'i güncelle (eğer gerekirse)
export PATH="/opt/homebrew/bin:$PATH"

# ngrok'u başlat
ngrok http 3000

