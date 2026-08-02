import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class StompService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map();
  }

  connect(onConnected, onError) {
    if (this.client && this.connected) {
      if (onConnected) onConnected();
      return;
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS('/ws-whiteboard'),
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        // Uncomment for verbose STOMP debugging
        // console.log('[STOMP]', str);
      },
      onConnect: () => {
        this.connected = true;
        console.log('Connected to WebSocket STOMP server');
        if (onConnected) onConnected();
      },
      onStompError: (frame) => {
        console.error('Broker error: ' + frame.headers['message']);
        console.error('Details: ' + frame.body);
        if (onError) onError(frame);
      },
      onDisconnect: () => {
        this.connected = false;
        console.log('Disconnected from STOMP server');
      }
    });

    this.client.activate();
  }

  subscribe(topic, callback) {
    if (!this.client || !this.connected) {
      console.warn('STOMP client not connected. Retrying subscription when connected...');
      setTimeout(() => this.subscribe(topic, callback), 500);
      return null;
    }

    if (this.subscriptions.has(topic)) {
      this.subscriptions.get(topic).unsubscribe();
    }

    const sub = this.client.subscribe(topic, (message) => {
      try {
        const payload = JSON.parse(message.body);
        callback(payload);
      } catch (err) {
        console.error('Failed to parse STOMP message payload:', err);
      }
    });

    this.subscriptions.set(topic, sub);
    return sub;
  }

  send(destination, body) {
    if (!this.client || !this.connected) {
      console.warn('Cannot send STOMP message: client disconnected');
      return;
    }

    this.client.publish({
      destination,
      body: JSON.stringify(body)
    });
  }

  disconnect() {
    if (this.client) {
      this.subscriptions.forEach((sub) => sub.unsubscribe());
      this.subscriptions.clear();
      this.client.deactivate();
      this.connected = false;
    }
  }
}

export const stompService = new StompService();
