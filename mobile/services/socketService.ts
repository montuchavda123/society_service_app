import { io, Socket } from 'socket.io-client';
import Config from '../constants/Config';

/**
 * 🛰️ SOCKET SERVICE (Singleton)
 * Centralizes real-time communication for the Society Service App.
 * Resolves bundling issues and prevents multiple redundant connections.
 */
class SocketService {
  public socket: Socket | null = null;

  /**
   * Initialize the socket connection
   * @param userId The ID of the authenticated user to join private rooms
   * @param societyId The ID of the society to join broadcast rooms
   */
  connect(userId?: string, societyId?: string) {
    if (!this.socket) {
      const baseUrl = Config.BASE_URL.replace('/api', '');
      
      this.socket = io(baseUrl, {
        transports: ['websocket'], // Force websocket for stability in React Native
        jsonp: false
      });

      this.socket.on('connect', () => {
        console.log('🟢 [SOCKET] Connected to Server:', this.socket?.id);
        
        if (userId) {
          this.socket?.emit('join_user', userId);
          console.log(`👤 [SOCKET] Joined User Room: user_${userId}`);
        }
        
        if (societyId) {
          this.socket?.emit('join_society', societyId);
          console.log(`🏢 [SOCKET] Joined Society Room: society_${societyId}`);
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔴 [SOCKET] Disconnected:', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ [SOCKET] Connection Error:', error.message);
      });
    }
  }

  /**
   * Get the singleton socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Safely disconnect the socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

const socketService = new SocketService();
export default socketService;
