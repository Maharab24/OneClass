import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class StompService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.connecting = false;
    this.connectCallbacks = [];
    this.topicListeners = new Map(); // topic -> Set<Function>
    this.topicSubscriptions = new Map(); // topic -> StompSubscription
  }

  connect(onConnected, onError) {
    if (onConnected) {
      this.connectCallbacks.push(onConnected);
    }

    if (this.connected && this.client?.active) {
      if (onConnected) {
        onConnected();
        this.connectCallbacks = this.connectCallbacks.filter((cb) => cb !== onConnected);
      }
      return;
    }

    if (this.connecting) {
      return;
    }

    this.connecting = true;

    if (this.client) {
      try {
        this.client.deactivate();
      } catch {
        // Ignore deactivation errors on stale client
      }
      this.client = null;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws-whiteboard'),
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        this.connected = true;
        this.connecting = false;
        console.log('[STOMP] Connected to WebSocket STOMP server');

        // Resubscribe all active topics
        this.resubscribeAll();

        // Run pending connection callbacks
        const callbacks = [...this.connectCallbacks];
        this.connectCallbacks = [];
        callbacks.forEach((cb) => {
          try {
            cb();
          } catch (e) {
            console.error('[STOMP] Error in connect callback:', e);
          }
        });
      },
      onStompError: (frame) => {
        console.error('[STOMP] Broker error:', frame.headers['message'], frame.body);
        if (onError) onError(frame);
      },
      onWebSocketClose: () => {
        this.connected = false;
        this.connecting = false;
      },
      onDisconnect: () => {
        this.connected = false;
        this.connecting = false;
        console.log('[STOMP] Disconnected from STOMP server');
      },
    });

    this.client = client;
    client.activate();
  }

  resubscribeAll() {
    if (!this.client || !this.connected) return;

    for (const [topic, listeners] of this.topicListeners.entries()) {
      if (listeners.size > 0 && !this.topicSubscriptions.has(topic)) {
        this.subscribeTopicOnBroker(topic);
      }
    }
  }

  subscribeTopicOnBroker(topic) {
    if (!this.client || !this.connected) return;

    // Unsubscribe existing if any
    if (this.topicSubscriptions.has(topic)) {
      try {
        this.topicSubscriptions.get(topic).unsubscribe();
      } catch {
        // Ignore
      }
      this.topicSubscriptions.delete(topic);
    }

    const sub = this.client.subscribe(topic, (message) => {
      try {
        const payload = JSON.parse(message.body);
        const listeners = this.topicListeners.get(topic);
        if (listeners) {
          listeners.forEach((callback) => {
            try {
              callback(payload);
            } catch (err) {
              console.error(`[STOMP] Error in topic (${topic}) listener:`, err);
            }
          });
        }
      } catch (err) {
        console.error('[STOMP] Failed to parse payload:', err);
      }
    });

    this.topicSubscriptions.set(topic, sub);
  }

  subscribe(topic, callback) {
    if (!this.topicListeners.has(topic)) {
      this.topicListeners.set(topic, new Set());
    }
    this.topicListeners.get(topic).add(callback);

    if (this.connected && this.client && !this.topicSubscriptions.has(topic)) {
      this.subscribeTopicOnBroker(topic);
    }

    // Return unregister function
    return () => {
      const listeners = this.topicListeners.get(topic);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.topicListeners.delete(topic);
          const sub = this.topicSubscriptions.get(topic);
          if (sub) {
            try {
              sub.unsubscribe();
            } catch {
              // Ignore
            }
            this.topicSubscriptions.delete(topic);
          }
        }
      }
    };
  }

  send(destination, body) {
    if (!this.client || !this.connected) {
      console.warn('[STOMP] Cannot send message: client not connected');
      return;
    }

    try {
      this.client.publish({
        destination,
        body: JSON.stringify(body),
      });
    } catch (e) {
      console.error('[STOMP] Error publishing message:', e);
    }
  }

  disconnect() {
    this.connectCallbacks = [];
    this.topicSubscriptions.forEach((sub) => {
      try {
        sub.unsubscribe();
      } catch {
        // Ignore
      }
    });
    this.topicSubscriptions.clear();
    this.topicListeners.clear();

    if (this.client) {
      try {
        this.client.deactivate();
      } catch {
        // Ignore
      }
      this.client = null;
    }
    this.connected = false;
    this.connecting = false;
  }
}

export const stompService = new StompService();
