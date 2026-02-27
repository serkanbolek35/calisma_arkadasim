# 📚 Çalışma Arkadaşını Bul

Üniversite öğrencilerine özel akademik eşleştirme platformu.

## 🚀 Kurulum

### 1. Bağımlılıkları yükle
```bash
npm install
```

### 2. Firebase projesi oluştur
1. [Firebase Console](https://console.firebase.google.com) > Yeni Proje
2. Authentication > Sign-in methods > Email/Password aktif et
3. Firestore Database oluştur (production modunda başlat)
4. Proje Ayarları > Genel > SDK yapılandırması > Yapılandırma

### 3. Ortam değişkenlerini ayarla
```bash
cp .env.example .env
# .env dosyasını Firebase değerleriyle doldur
```

### 4. Geliştirme sunucusunu başlat
```bash
npm run dev
```

## 📁 Proje Yapısı

```
src/
├── components/         # Paylaşılan bileşenler
│   ├── ui/            # Button, Input, Modal, ...
│   └── layout/        # Navbar, Footer, AuthLayout, ...
├── views/              # Sayfa görünümleri
│   ├── public/        # Landing, About, FAQ, ...
│   ├── auth/          # Login, Register, EmailVerify, ...
│   ├── onboarding/    # Çok adımlı profil kurulum
│   ├── app/           # Dashboard, Matches, Sessions, ...
│   ├── admin/         # Admin panel
│   └── system/        # 404, 500, Maintenance
├── context/           # AuthContext
├── hooks/             # Custom hooks
├── services/          # Firebase servis katmanı
├── utils/             # Yardımcı fonksiyonlar
└── router/            # AppRouter, ProtectedRoute
```

## 🔒 Güvenlik

- Sadece `.edu.tr` uzantılı e-postalar kabul edilir
- Firebase Authentication ile güvenli giriş
- E-posta doğrulama zorunluluğu
- Firestore Security Rules ile veri erişim kontrolü

## 📋 Firebase Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Kullanıcılar sadece kendi dokümanlarına erişebilir
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /profile/{docId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /preferences/{docId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Eşleşmeler - katılımcılar okuyabilir
    match /matches/{matchId} {
      allow read: if request.auth != null && 
        request.auth.uid in resource.data.users;
    }
    
    // Admin okuma yetkisi
    match /{document=**} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 🗺️ Route Haritası

| URL | Sayfa |
|-----|-------|
| `/` | Landing Page |
| `/giris` | Giriş Yap |
| `/kayit` | Kayıt Ol |
| `/email-dogrula` | E-posta Doğrulama |
| `/sifremi-unuttum` | Şifre Sıfırlama |
| `/onboarding` | Profil Kurulum |
| `/dashboard` | Dashboard |
| `/hakkimizda` | Hakkımızda |
| `/nasil-calisir` | Nasıl Çalışır? |
| `/sss` | SSS |
| `/iletisim` | İletişim |

## 🏗️ Sonraki Adımlar

- [ ] Eşleşme motoru (matching algorithm)
- [ ] Canlı oturum sayfası (kronometre)
- [ ] İlerleme & analiz grafikleri
- [ ] Admin paneli
- [ ] Anket modülü
- [ ] Bildirim sistemi
- [ ] Firebase Hosting deployment
