import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.connected = false;
    this.listeners = [];
  }

  connect(userId, onNotificationReceived) {
    const token = localStorage.getItem('token');
    const socket = new SockJS('http://localhost:8080/ws');
    
    this.stompClient = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        'Authorization': `Bearer ${token}`
      },
      debug: (str) => {
        console.log('WebSocket:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });

    this.stompClient.onConnect = () => {
      console.log('✅ Conectado al WebSocket');
      this.connected = true;
      
      // Suscribirse a notificaciones personales
      this.stompClient.subscribe(`/user/${userId}/queue/notifications`, (message) => {
        if (message.body) {
          const notification = JSON.parse(message.body);
          console.log('📢 Notificación recibida:', notification);
          if (onNotificationReceived) {
            onNotificationReceived(notification);
          }
        }
      });
    };

    this.stompClient.onStompError = (frame) => {
      console.error('Error en STOMP:', frame);
    };

    this.stompClient.activate();
  }

  disconnect() {
    if (this.stompClient && this.connected) {
      this.stompClient.deactivate();
      this.connected = false;
      console.log('🔌 Desconectado del WebSocket');
    }
  }

  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }
}

export default new WebSocketService();