#!/bin/bash

# HTTPS Setup Script for Localhost
# Bu script mkcert kurulumunu ve SSL sertifikalarını oluşturur

echo "🔒 HTTPS Kurulumu Başlatılıyor..."
echo ""

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "❌ mkcert bulunamadı!"
    echo ""
    echo "Lütfen önce mkcert'i kurun:"
    echo "  brew install mkcert"
    echo ""
    exit 1
fi

echo "✅ mkcert bulundu"
echo ""

# Install local CA
echo "📦 Yerel CA kurulumu yapılıyor..."
mkcert -install

if [ $? -ne 0 ]; then
    echo "❌ CA kurulumu başarısız oldu!"
    exit 1
fi

echo "✅ CA kurulumu tamamlandı"
echo ""

# Create certificates
echo "🔐 SSL sertifikaları oluşturuluyor..."
mkcert localhost 127.0.0.1 ::1

if [ $? -ne 0 ]; then
    echo "❌ Sertifika oluşturma başarısız oldu!"
    exit 1
fi

echo ""
echo "✅ SSL sertifikaları oluşturuldu!"
echo ""
echo "📋 Oluşturulan dosyalar:"
echo "   - localhost+2.pem (sertifika)"
echo "   - localhost+2-key.pem (özel anahtar)"
echo ""
echo "🚀 Artık 'npm run dev' komutu ile HTTPS sunucusunu başlatabilirsiniz!"
echo "   URL: https://localhost:3000"
echo ""

