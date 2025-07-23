import subprocess
import time
import json
import urllib.parse
from websocket._core import create_connection

# WebSocket bağlantısı
ws = create_connection("ws://localhost:8000")
ws.send("scrapper started (IPv4 mode, exact only)")

# Sabit bilgiler
scrape_do_token = ""
raw_url = "https://www.tesla.com/coinorder/api/v4/inventory-results?query=%7B%22query%22%3A%7B%22model%22%3A%22my%22%2C%22condition%22%3A%22new%22%2C%22options%22%3A%7B%7D%2C%22arrangeby%22%3A%22Price%22%2C%22order%22%3A%22asc%22%2C%22market%22%3A%22TR%22%2C%22language%22%3A%22tr%22%2C%22super_region%22%3A%22north%20america%22%2C%22lng%22%3A%22%22%2C%22lat%22%3A%22%22%2C%22zip%22%3A%22%22%2C%22range%22%3A0%7D%2C%22offset%22%3A0%2C%22count%22%3A24%2C%22outsideOffset%22%3A0%2C%22outsideSearch%22%3Afalse%2C%22isFalconDeliverySelectionEnabled%22%3Atrue%2C%22version%22%3A%22v2%22%7D"
encoded_url = urllib.parse.quote(raw_url, safe="")
scrape_url = f"https://api.scrape.do?token={scrape_do_token}&url={encoded_url}&super=true"

TIMEOUT = 70
SLEEP_TIME = 30

# İstenilen renkler
DESIRED_COLORS = [
    "Pearl White Multi-Coat",
    "Pearl White-Lackierung",
    "Pearl White",
    "WHITE",
    "Quicksilver",
    "Lackierung Quicksilver",
    "SILVER",
]

def is_desired_color(car_data):
    try:
        # Tesla API'den gelen veriye göre renk bilgisini çıkar
        # Farklı alanları kontrol et
        paint_color = None
        
        # Paint/color bilgisini farklı yerlerden almaya çalış
        if "PAINT" in car_data:
            paint_color = car_data["PAINT"]
        elif "paint" in car_data:
            paint_color = car_data["paint"]
        elif "color" in car_data:
            paint_color = car_data["color"]
        elif "PaintColor" in car_data:
            paint_color = car_data["PaintColor"]
        elif "exterior_color" in car_data:
            paint_color = car_data["exterior_color"]
        
        if isinstance(paint_color, dict):
            color_value = paint_color.get("value") or paint_color.get("name") or paint_color.get("display_name")
            if color_value:
                paint_color = color_value
        
        if isinstance(paint_color, list):
            if len(paint_color) > 0:
                paint_color = paint_color[0]
                print(f"🎨 Araç rengi tespit edildi (liste formatında): {paint_color}")
            else:
                print("⚠️ Renk listesi boş")
                return True 
        
        if paint_color:
            if not isinstance(paint_color, str):
                paint_color = str(paint_color)
                
            print(f"🎨 Araç rengi tespit edildi: {paint_color}")
            
            for desired_color in DESIRED_COLORS:
                if desired_color.lower() in paint_color.lower() or paint_color.lower() in desired_color.lower():
                    print(f"✅ İSTENEN RENK BULUNDU: {paint_color}")
                    return True
            
            print(f"❌ İstenmeyen renk: {paint_color}")
            return False
        else:
            print("⚠️ Renk bilgisi bulunamadı, tüm alanlar:")
            print(json.dumps(car_data, indent=2, ensure_ascii=False)[:500] + "...")
            return True
            
    except Exception as e:
        print(f"❌ Renk kontrolü sırasında hata: {e}")
        print(f"🔍 Hata veren veri tipi: {type(paint_color) if 'paint_color' in locals() else 'Bilinmiyor'}")
        if 'paint_color' in locals():
            print(f"🔍 Hata veren veri: {paint_color}")
        return True

def send_request():
    try:
        cmd = [
            "curl",
            "--location",
            scrape_url,
            "--header", "Host: www.tesla.com",
            "--header", "accept: */*",
            "--header", "accept-language: en-US,en;q=0.9,tr;q=0.8",
            "--header", "cache-control: no-cache",
            "--header", "pragma: no-cache",
            "--header", "priority: u=1, i",
            "--header", "referer: https://www.tesla.com/tr_TR/inventory/new/my?arrangeby=plh&zip=&range=0",
            "--header", 'sec-ch-ua: "Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
            "--header", "sec-ch-ua-mobile: ?0",
            "--header", 'sec-ch-ua-platform: "Windows"',
            "--header", "sec-fetch-dest: empty",
            "--header", "sec-fetch-mode: cors",
            "--header", "sec-fetch-site: same-origin",
            "--header", "user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
        ]

        result = subprocess.run(cmd, capture_output=True, timeout=TIMEOUT)
        output = result.stdout.decode().strip()

        if output:
            try:
                print("✉️ Gelen ham veri:\n", output[:500], "\n")  # ilk 500 karakter
                data = json.loads(output)
                results = data.get("results", [])

                if isinstance(results, list) and results:
                    total_cars = len(results)
                    filtered_cars = 0
                    
                    print(f"📊 Toplam {total_cars} araç bulundu, renk filtresi uygulanıyor...")
                    print(f"🎯 İstenen renkler: {', '.join(DESIRED_COLORS)}")
                    
                    for car in results:
                        # Renk kontrolü yap
                        if is_desired_color(car):
                            filtered_cars += 1
                            item_json = json.dumps(car, ensure_ascii=False)
                            ws.send(item_json)
                            print(f"✅ Gönderildi (#{filtered_cars}):\n", item_json[:200], "...\n")
                        else:
                            print(f"⏭️ Renk uyuşmadığı için atlandı")
                    
                    print(f"📈 SONUÇ: {total_cars} araçtan {filtered_cars} tanesi istenen renklerde bulundu")
                    
                    if filtered_cars == 0:
                        print("⚠️ HİÇBİR ARAÇ İSTENEN RENKLERİNİZDE DEĞİL!")
                        print("💡 İpucu: DESIRED_COLORS listesini kontrol edin veya mevcut renkleri görmek için logları inceleyin")
                        
                else:
                    print("ℹ️ 'results' dizisi yok veya boş.")
            except Exception as e:
                print(f"❌ JSON parse hatası: {e}")
        else:
            print("⚠️ BOŞ CEVAP")
    except subprocess.TimeoutExpired:
        print(f"⏰ TIMEOUT: İstek {TIMEOUT} saniyede tamamlanamadı, devam ediliyor...")
    except subprocess.CalledProcessError as e:
        print(f"🚫 CURL HATASI: {e}")
    except Exception as e:
        print(f"🚫 HATA: {e}")

# Başlangıçta mevcut konfigürasyonu göster
print("🚗 Tesla Renk Filtreli Bot Başlatıldı")
print("=" * 50)
print("🎨 İSTENEN RENKLER:")
for i, color in enumerate(DESIRED_COLORS, 1):
    print(f"  {i}. {color}")
print("=" * 50)
print("💡 İpucu: Renkleri değiştirmek için scraper.py dosyasındaki DESIRED_COLORS listesini düzenleyin")
print("🔄 Tarama başlıyor...\n")

# Sonsuz döngüde istek gönder
while True:
    send_request()
    time.sleep(SLEEP_TIME)
