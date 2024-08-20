"use client";
import { io, Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "./type";
 
export interface SocketInterface {
  socket: Socket<ServerToClientEvents, ClientToServerEvents>;
}
 
class SocketConnection implements SocketInterface {
  public socket: Socket;
  public socketEndpoint = process.env.NEXT_PUBLIC_SERVER_DOMAIN||"";
  // The constructor will initialize the Socket Connection
  constructor(uid:string) {
    this.socket = io(this.socketEndpoint, {
      auth: {
      },
      withCredentials:true
    });
  }
}
 
let socketConnection: SocketConnection | undefined;
 
// The SocketFactory is responsible for creating and returning a single instance of the SocketConnection class
// Implementing the singleton pattern
export class SocketFactory {
  public static init(uid:string): SocketConnection {
    if (!socketConnection) {
      socketConnection = new SocketConnection(uid);
    }
    return socketConnection;
  }
  public static disconnect(): void {
    if (socketConnection) {
      socketConnection.socket.disconnect();
      socketConnection = undefined;
    }
    return;
  }
  
}