import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private userSockets = new Map<number, string>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token || client.handshake.headers.authorization?.split(' ')[1];
    console.log('🔌 Neue Socket-Verbindung von', client.id);

    if (!token) {
      console.log('❌ Kein Token → disconnect');
      return client.disconnect();
    }

    try {
      const payload = this.jwtService.verify(token);
      this.userSockets.set(payload.sub, client.id);
      console.log(`👤 User ${payload.sub} erfolgreich verbunden (Socket ${client.id})`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.log('❌ JWT Verify fehlgeschlagen:', errMsg);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        console.log(`👤 User ${userId} disconnected`);
        break;
      }
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { receiverId: number; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('📨 sendMessage empfangen:', data);

    const token = client.handshake.auth?.token || client.handshake.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('❌ Kein Token in sendMessage');
      return;
    }

    let sender;
    try {
      sender = this.jwtService.verify(token);
      console.log(`✅ Sender User ${sender.sub} erkannt`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.log('❌ JWT in sendMessage fehlgeschlagen:', errMsg);
      return;
    }

    // Message in DB speichern
    const message = await this.prisma.message.create({
      data: {
        content: data.content,
        senderId: sender.sub,
        receiverId: data.receiverId,
      },
      include: { sender: true },
    });

    console.log('💾 Message in DB gespeichert, ID:', message.id);

    // An Empfänger senden
    const receiverSocket = this.userSockets.get(data.receiverId);
    if (receiverSocket) {
      console.log(`📤 Sende newMessage an User ${data.receiverId} (Socket ${receiverSocket})`);
      this.server.to(receiverSocket).emit('newMessage', message);
    } else {
      console.log(`⚠️ Empfänger ${data.receiverId} ist nicht online`);
    }

    // Bestätigung an Sender
    console.log(`📤 Sende messageSent zurück an Sender ${sender.sub}`);
    client.emit('messageSent', message);

    return message;
  }
}
