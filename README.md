# Tesla Türkiye Otomatik Sipariş Botu (Eğitim Amaçlı)

## Açıklama (Türkçe)

Bu bot, **Chrome geliştirici konsolunda** çalışmaktadır.  
`order_new.js` dosyası, arka plandaki **WebSocket** sunucusuna bağlanarak **stok güncellemelerini** dinler.

Öne çıkan değişiklikler ve özellikler:  
- **Hook** kullanmaya gerek kalmadan, `userData` değişkenini doğrudan kendi kişisel bilgilerinizle düzenleyebilirsiniz.  
- `httpserver` ve `date_time_fix` dosyalarına artık ihtiyaç yoktur.  

WebSocket üzerinden stok bilgisi geldiğinde:  
- `hCaptcha`, `Akamai` gibi engeller aşılır,  
- Otomatik olarak **rezervasyon** oluşturulur,  
- Ardından `payment.js` dosyası ile **ödeme işlemi** gerçekleştirilir,  
- Böylece alım işlemi tamamlanmış olur.

### Ek Bileşenler

Bu projeye aşağıdaki yardımcı Python bileşenleri eklenmiştir:

- `scraper.py`: Tesla'nın stok bilgilerini düzenli olarak tarar ve günceller.  
- `wsserver.py`: WebSocket sunucusudur, gerçek zamanlı stok verisini istemcilere iletir.  
- `httpserver.py`: (Eskiden `date_time_fix` dosyasını sunmak için kullanılırdı, artık gerekli değildir.)

> 📢 **BU BOT EĞİTİM AMAÇLIDIR. BUNUNLA SİPARİŞ VEREMEZSİNİZ. SADECE MANTIĞINI ANLAMANIZ İÇİN PAYLAŞTIM!**

---

## Description (English)

This bot runs in the **Chrome developer console**.  
The `order_new.js` script connects to the backend **WebSocket** server and listens for **stock updates**.

Key changes and features:  
- You can edit the `userData` variable directly with your own personal information **without needing any hooks**.  
- There is no longer a need for `httpserver` or `date_time_fix` files.

When a stock update is received:  
- It bypasses protections like `hCaptcha` and `Akamai`,  
- Automatically creates a **reservation**,  
- Then uses `payment.js` to **process the payment**,  
- Thus completing the purchase.

### Additional Components

The following helper Python components are included in this project:

- `scraper.py`: Scrapes Tesla's stock information periodically and keeps it updated.  
- `wsserver.py`: A WebSocket server that delivers real-time stock updates to clients.  
- `httpserver.py`: (Used previously to serve the `date_time_fix` script, now obsolete.)

> 📢 **THIS BOT IS FOR EDUCATIONAL PURPOSES ONLY. YOU CANNOT PLACE ORDERS WITH IT. IT IS SHARED JUST TO HELP YOU UNDERSTAND THE LOGIC!**

---

thx for @erknkaya for deobfuscation
