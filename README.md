# 🎮 E-Spor Takip Merkezi

> **League of Legends, CS2, VALORANT ve Dota 2** turnuvalarını canlı takip edebileceğiniz, favori takımlarınız için hatırlatma alabileceğiniz Android tabanlı mobil uygulama.

---

## 📌 Öğrenci Bilgileri

| Bilgi             | Değer                         |
| ----------------- | ----------------------------- |
| **Ad Soyad**      | Salih Can Diler               |
| **Öğrenci No**    | 24010501117                   |
| **Ders**          | Mobil Programlama             |
| **Dönem**         | 2025–2026 Bahar               |

---

## 🎯 Projenin Amacı ve Açıklaması

E-Spor Takip Merkezi, popüler e-spor oyunlarındaki (LoL, CS2, VALORANT, Dota 2) profesyonel maçları takip etmek için geliştirilmiş bir **Android uygulamasıdır**. Uygulama, bir **WebView** içinde çalışan tam özellikli bir web uygulaması (PWA) barındırır.

### Temel Özellikler

- 🔴 **Canlı Maç Takibi** — Devam eden maçları anlık olarak görüntüleme
- 📅 **Bugünün Maçları** — Günlük maç programını listeleme
- 🔮 **Yaklaşan Maçlar** — Gelecek maçları takip etme
- 🏆 **Son Sonuçlar** — Tamamlanan maç sonuçlarını görüntüleme
- ⭐ **Favori Takım Yönetimi** — Takım ekleme/çıkarma ve favori takım maçlarını filtreleme
- 🔔 **Bildirim Sistemi** — Maç başlangıcı, sonucu ve 15 dk öncesi hatırlatma
- 📋 **Günlük Özet** — Her sabah 10:00'da günlük maç özeti
- 🎮 **Oyun Filtreleme** — LoL, CS2, VALORANT ve Dota 2 arasında filtreleme
- 📺 **Yayın Bilgisi** — Twitch ve YouTube canlı yayın bağlantıları
- 🔑 **PandaScore API Desteği** — Gerçek maç verileri için API entegrasyonu (demo mod da mevcut)

---

## 🛠️ Kullanılan Teknolojiler / Kütüphaneler

### Android (Native)

| Teknoloji                 | Açıklama                                      |
| ------------------------- | --------------------------------------------- |
| **Java**                  | Ana programlama dili                          |
| **Android SDK 34**        | Hedef API seviyesi                            |
| **WebView (WebKit)**      | Web uygulamasını Android içinde barındırma     |
| **AndroidX AppCompat**    | Geriye dönük uyumluluk kütüphanesi            |
| **ConstraintLayout**      | UI layout bileşeni                            |
| **JavascriptInterface**   | JS ↔ Android iletişim köprüsü                |

### Web Uygulaması (PWA)

| Teknoloji              | Açıklama                                           |
| ---------------------- | -------------------------------------------------- |
| **HTML5**              | Sayfa yapısı ve semantik işaretleme                |
| **CSS3**               | Responsive tasarım, dark mode, glassmorphism       |
| **JavaScript (ES6+)**  | Uygulama mantığı, API iletişimi, bildirim sistemi  |
| **PandaScore API**     | E-spor maç verileri (REST API)                     |
| **Web Notifications**  | Tarayıcı/uygulama bildirimleri                     |
| **localStorage**       | Favori takımlar ve ayarların yerel depolanması     |
| **Google Fonts**       | Inter ve JetBrains Mono font aileleri              |
| **PWA Manifest**       | Progressive Web App desteği                        |

---

## 📁 Proje Klasör Yapısı

```
PROJE/
├── README.md                          # Bu dokümantasyon dosyası
├── esports-tracker.apk                # Derlenmiş APK dosyası
│
├── esports-tracker/                   # Web Uygulaması (PWA)
│   ├── index.html                     # Ana HTML sayfası
│   ├── manifest.json                  # PWA manifest dosyası
│   ├── css/
│   │   └── styles.css                 # Tüm stil tanımları (~32 KB)
│   └── js/
│       ├── api.js                     # PandaScore API iletişimi
│       ├── app.js                     # Ana uygulama mantığı
│       ├── favorites.js               # Favori takım yönetimi
│       ├── notifications.js           # Bildirim motoru
│       └── utils.js                   # Yardımcı fonksiyonlar
│
└── esports-tracker-android/           # Android Projesi
    ├── build.gradle                   # Root build yapılandırması
    ├── settings.gradle                # Proje ayarları
    ├── gradle.properties              # Gradle özellikleri
    ├── gradle/                        # Gradle wrapper
    └── app/
        ├── build.gradle               # App modülü build yapılandırması
        └── src/main/
            ├── java/com/esports/tracker/
            │   ├── MainActivity.java      # Ana Activity (WebView yönetimi)
            │   └── SplashActivity.java    # Açılış ekranı
            └── res/
                ├── layout/
                │   ├── activity_main.xml      # Ana ekran layout
                │   └── activity_splash.xml    # Splash ekran layout
                ├── drawable/
                │   └── ic_launcher.xml        # Uygulama ikonu
                └── values/
                    ├── colors.xml             # Renk tanımları
                    ├── strings.xml            # Metin tanımları
                    └── themes.xml             # Tema tanımları
```

---

## ⚙️ Kurulum Adımları

### Gereksinimler

- **Android Studio** Arctic Fox veya üzeri
- **JDK 8** veya üzeri
- **Android SDK 34** (compileSdk)
- **Min SDK 24** (Android 7.0 Nougat)

### Adım 1: Projeyi Klonlayın

```bash
git clone https://github.com/SalihCan14/EsportsTracker.git
cd EsportsTracker
```

### Adım 2: Android Studio ile Açın

1. Android Studio'yu açın
2. **File → Open** menüsünden `esports-tracker-android` klasörünü seçin
3. Gradle senkronizasyonunun tamamlanmasını bekleyin

### Adım 3: Web Uygulamasını Android Assets'e Kopyalayın

Web uygulaması dosyaları (`esports-tracker/` klasörü) Android projesinin `app/src/main/assets/` dizinine kopyalanmalıdır:

```
esports-tracker-android/app/src/main/assets/
├── index.html
├── manifest.json
├── css/
│   └── styles.css
└── js/
    ├── api.js
    ├── app.js
    ├── favorites.js
    ├── notifications.js
    └── utils.js
```

### Adım 4: Çalıştırın

1. Bir Android emülatörü başlatın veya fiziksel cihaz bağlayın
2. **Run → Run 'app'** ile uygulamayı çalıştırın

### Alternatif: Hazır APK

Projenin kök dizininde derlenmiş `esports-tracker.apk` dosyası bulunmaktadır. Doğrudan Android cihazınıza yükleyebilirsiniz.

---

## 🚀 Çalıştırma / Kullanım Talimatları

### Uygulama Akışı

1. **Splash Ekranı** — Uygulama açıldığında 1.5 saniyelik animasyonlu açılış ekranı gösterilir
2. **Ana Ekran** — WebView içinde e-spor takip arayüzü yüklenir
3. **Oyun Filtreleme** — Üst menüden LoL, CS2, VALORANT, Dota 2 filtreleri kullanılabilir
4. **Favori Takım Ekleme** — Sidebar'daki "⭐ Takım Yönetimi" butonundan favori takımlar eklenebilir
5. **Bildirimler** — Ayarlar panelinden bildirim izni verilebilir ve hatırlatma ayarları yapılabilir
6. **API Ayarı** — Gerçek veriler için Ayarlar → PandaScore API Anahtarı alanına ücretsiz anahtar girilir

### Modlar

| Mod       | Açıklama                                                        |
| --------- | --------------------------------------------------------------- |
| **Demo**  | API anahtarı olmadan sahte verilerle çalışır (varsayılan)       |
| **Canlı** | PandaScore API anahtarı ile gerçek zamanlı maç verileri gösterir |

---

## 📸 Ekran Görüntüleri

> *Ekran görüntüleri GitHub reposunun `screenshots/` klasörüne eklenecektir.*

| Splash Ekranı | Ana Ekran | Canlı Maçlar | Ayarlar |
|:---:|:---:|:---:|:---:|
| Animasyonlu açılış | Maç listesi ve sidebar | Canlı skor takibi | API ve bildirim ayarları |

---

## 🔗 GitHub Proje Bağlantısı

🔗 **https://github.com/SalihCan14/EsportsTracker**

---

## 📚 Kaynakça ve Yararlanılan Bağlantılar

1. **PandaScore API Dokümantasyonu** — https://developers.pandascore.co/docs
2. **Android WebView Kılavuzu** — https://developer.android.com/develop/ui/views/layout/webapps/webview
3. **Android JavascriptInterface** — https://developer.android.com/reference/android/webkit/JavascriptInterface
4. **MDN Web Docs – Notifications API** — https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API
5. **MDN Web Docs – localStorage** — https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
6. **Progressive Web Apps (PWA)** — https://web.dev/progressive-web-apps/
7. **Google Fonts (Inter, JetBrains Mono)** — https://fonts.google.com/
8. **Android Developers – Splash Screen** — https://developer.android.com/develop/ui/views/launch/splash-screen
9. **CSS Glassmorphism Teknikleri** — https://css.glass/
10. **Material Design Color System** — https://m3.material.io/styles/color/overview

---

## 📄 Lisans

Bu proje **eğitim amaçlı** geliştirilmiştir.

---

*Son güncelleme: Haziran 2026*
