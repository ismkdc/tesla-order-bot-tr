# Tesla Türkiye Otomatik Sipariş Botu (Eğitim Amaçlı)

## Açıklama (Türkçe)

Bu bot, **Chrome geliştirici konsolunda** çalışmaktadır.  
`order.js` dosyası, arka plandaki **WebSocket** sunucusuna bağlanarak **stok güncellemelerini** dinler.

WebSocket üzerinden stok bilgisi geldiğinde:
- `hCaptcha`, `Akamai` gibi engelleri aşar,
- Otomatik olarak **rezervasyon** oluşturur,
- Ardından `payment.js` dosyası ile **ödeme işlemi** gerçekleştirilir,
- Böylece alım işlemi tamamlanmış olur.

---

> 📢 **BU BOT EĞİTİM AMAÇLIDIR. BUNUNLA SİPARİŞ VEREMEZSİNİZ. SADECE MANTIĞINI ANLAMANIZ İÇİN PAYLAŞTIM!**

---

## Description (English)

This bot runs in the **Chrome developer console**.  
The `order.js` script connects to the backend **WebSocket** and listens for **stock updates**.

When a stock update is received:
- It bypasses protections like `hCaptcha` and `Akamai`,
- Automatically creates a **reservation**,
- Then uses `payment.js` to **process the payment**,
- Thus completing the purchase.

---

> 📢 **THIS BOT IS FOR EDUCATIONAL PURPOSES ONLY. YOU CANNOT PLACE ORDERS WITH IT. IT IS SHARED JUST TO HELP YOU UNDERSTAND THE LOGIC!**

---
