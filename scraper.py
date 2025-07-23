import subprocess
import time
import json
import urllib.parse
from websocket import create_connection

# WebSocket bağlantısı
ws = create_connection("ws://localhost:8000")
ws.send("scrapper started (IPv4 mode, exact only)")

# scrape do hesabı açıp kendi tokeninizi koyun
scrape_do_token = "55708a8059a14c959c1d7f66bc8e18f18eebc73ac36"
raw_url = "https://www.tesla.com/coinorder/api/v4/inventory-results?query=%7B%22query%22%3A%7B%22model%22%3A%22my%22%2C%22condition%22%3A%22new%22%2C%22options%22%3A%7B%7D%2C%22arrangeby%22%3A%22Price%22%2C%22order%22%3A%22asc%22%2C%22market%22%3A%22TR%22%2C%22language%22%3A%22tr%22%2C%22super_region%22%3A%22north%20america%22%2C%22lng%22%3A%22%22%2C%22lat%22%3A%22%22%2C%22zip%22%3A%22%22%2C%22range%22%3A0%7D%2C%22offset%22%3A0%2C%22count%22%3A24%2C%22outsideOffset%22%3A0%2C%22outsideSearch%22%3Afalse%2C%22isFalconDeliverySelectionEnabled%22%3Atrue%2C%22version%22%3A%22v2%22%7D"
encoded_url = urllib.parse.quote(raw_url, safe="")
scrape_url = f"https://api.scrape.do?token={scrape_do_token}&url={encoded_url}&super=true"

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

        result = subprocess.run(cmd, capture_output=True, timeout=10)
        output = result.stdout.decode().strip()

        if output:
            try:
                print("✉️ Gelen ham veri:\n", output[:500], "\n")  # ilk 500 karakter
                data = json.loads(output)
                results = data.get("results", [])

                if isinstance(results, list) and results:
                    for car in results:
                        item_json = json.dumps(car, ensure_ascii=False)
                        ws.send(item_json)
                        print("✅ Gönderildi:\n", item_json, "\n")
                else:
                    print("ℹ️ 'results' dizisi yok veya boş.")
            except Exception as e:
                print(f"❌ JSON parse hatası: {e}")
        else:
            print("⚠️ BOŞ CEVAP")
    except Exception as e:
        print(f"🚫 HATA: {e}")

# Sonsuz döngüde istek gönder
while True:
    send_request()
