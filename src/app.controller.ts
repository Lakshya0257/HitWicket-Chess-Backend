import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { GameService } from './app.service';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { map } from 'rxjs';

@Injectable()
@WebSocketGateway()
export class AppController {
  private status: Map<string, string> = new Map();
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameService: GameService) {}

  @SubscribeMessage('joinGame')
  async handleNewPlayer(@MessageBody() data:{playerId: string; roomId: string}, @ConnectedSocket() socket: Socket){
    const sockets = await this.server.in(data.roomId).fetchSockets();
    if(sockets.length===2){
      socket.emit('info', "Room already full, cannot join");
    }else{
      socket.rooms.forEach(async room=>{
        await socket.leave(room);
      });
      socket.data.playerId = data.playerId;
      socket.join(data.roomId);
      this.status.set(data.playerId, data.roomId);
      if(sockets.length===1){
        socket.emit('info', "Room joined successfully! Starting game...");
        this.handleInitGame([sockets[0].data.playerId as string, socket.data.playerId as string], data.roomId);
      }else{
        socket.emit('info', "Room joined successfully, waiting for another player");
      }
    }
  }

  handleInitGame(playerIds: [string, string], roomId: string) {
    const gameState = this.gameService.initializeGame(playerIds);
    this.server.to(roomId).emit('gameState', gameState);
  }

  @SubscribeMessage('move')
  handleMove(@MessageBody() data: { playerId: string; move: string }) {
    const gameState = this.gameService.processMove(data.playerId, data.move);
    this.server.to(this.status.get(data.playerId)).emit('gameState', gameState);
  }
}
