# Tesla Türkiye Otomatik Sipariş Botu (Eğitim Amaçlı)

## Açıklama (Türkçe)

Bu bot, **Chrome geliştirici konsolunda** çalışmaktadır.  
`order.js` dosyası, arka plandaki **WebSocket** sunucusuna bağlanarak **stok güncellemelerini** dinler.

WebSocket üzerinden stok bilgisi geldiğinde:
- `hCaptcha`, `Akamai` gibi engelleri aşar,
- Otomatik olarak **rezervasyon** oluşturur,
- Ardından `payment.js` dosyası ile **ödeme işlemi** gerçekleştirilir,
- Böylece alım işlemi tamamlanmış olur.

### Ek Bileşenler

Bu projeye aşağıdaki yardımcı Python bileşenleri eklenmiştir:

- `scraper.py`: Tesla'nın stok bilgilerini düzenli olarak tarar ve günceller.
- `wsserver.py`: WebSocket sunucusudur, gerçek zamanlı stok verisini istemcilere iletir.
- `httpserver.py`: `order.js` ve `payment.js` gibi istemci tarafı dosyaları sunmak için basit bir HTTP sunucusu sağlar.

> 📢 **BU BOT EĞİTİM AMAÇLIDIR. BUNUNLA SİPARİŞ VEREMEZSİNİZ. SADECE MANTIĞINI ANLAMANIZ İÇİN PAYLAŞTIM!**

---

## Description (English)

This bot runs in the **Chrome developer console**.  
The `order.js` script connects to the backend **WebSocket** server and listens for **stock updates**.

When a stock update is received:
- It bypasses protections like `hCaptcha` and `Akamai`,
- Automatically creates a **reservation**,
- Then uses `payment.js` to **process the payment**,
- Thus completing the purchase.

### Additional Components

The following helper Python components are included in this project:

- `scraper.py`: Scrapes Tesla's stock information periodically and keeps it updated.
- `wsserver.py`: A WebSocket server that delivers real-time stock updates to clients.
- `httpserver.py`: A basic HTTP server that serves client-side scripts like `order.js` and `payment.js`.

> 📢 **THIS BOT IS FOR EDUCATIONAL PURPOSES ONLY. YOU CANNOT PLACE ORDERS WITH IT. IT IS SHARED JUST TO HELP YOU UNDERSTAND THE LOGIC!**
