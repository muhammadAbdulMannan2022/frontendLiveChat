
export interface User {
  id: number;
  email: string;
  isVerified: boolean;
  createdAt: string;
}

export interface Room {
  id: string;
  user1Id: number;
  user2Id: number;
  messages?: Message[];
}

export interface Message {
  id: string;
  roomId: string;
  senderId: number | 'me';
  content: string;
  createdAt: string;
}

export interface RoomResponse {
  rooms: Room[];
  token: string;
}

export interface WSEvent<T = any> {
  type: "NEW_MESSAGE" | "ERROR" | "MESSAGE_SENT" | "ROOM_UPDATE";
  data: T;
  message?: string;
}

export enum AuthStage {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  VERIFY = 'VERIFY'
}
