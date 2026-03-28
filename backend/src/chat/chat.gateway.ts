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
    origin: 'http://localhost:3001',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;                     // ← hier das ! hinzugefügt

  private userSockets = new Map<number, string>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token || client.handshake.headers.authorization?.split(' ')[1];
    if (!token) return client.disconnect();

    try {
      const payload = this.jwtService.verify(token);
      this.userSockets.set(payload.sub, client.id);
      console.log(`👤 User ${payload.sub} connected`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
      }
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { receiverId: number; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const token = client.handshake.auth?.token || client.handshake.headers.authorization?.split(' ')[1];
    const sender = this.jwtService.verify(token);

    const message = await this.prisma.message.create({
      data: {
        content: data.content,
        senderId: sender.sub,
        receiverId: data.receiverId,
      },
      include: { sender: true },
    });

    const receiverSocket = this.userSockets.get(data.receiverId);
    if (receiverSocket) {
      this.server.to(receiverSocket).emit('newMessage', message);
    }

    client.emit('messageSent', message);

    return message;
  }
}
