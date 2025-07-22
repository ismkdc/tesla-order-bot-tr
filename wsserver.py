import json
from simple_websocket_server import WebSocketServer, WebSocket

clients = []

class TeslaDataServer(WebSocket):
    def connected(self):
        print(f"{self.address} bağlandı")
        clients.append(self)

    def handle_close(self):
        print(f"{self.address} ayrıldı")
        clients.remove(self)

    def handle_message(self, message):
        print(f"Gelen veri: {message[:80]}...")
        for client in clients:
            client.send_message(message)

    def handle(self):
        for client in clients:
                client.send_message(self.data)

server = WebSocketServer('0.0.0.0', 8000, TeslaDataServer)
print("WebSocket sunucusu 8000 portunda başlatıldı.")
server.serve_forever()