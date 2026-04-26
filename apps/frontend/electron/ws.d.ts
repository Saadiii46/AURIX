declare module 'ws' {
  import { EventEmitter } from 'events';
  class WebSocket extends EventEmitter {
    constructor(url: string, protocols?: string | string[]);
    close(): void;
    send(data: string | Buffer): void;
    on(event: 'open', listener: () => void): this;
    on(event: 'message', listener: (data: Buffer) => void): this;
    on(event: 'close', listener: () => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
  }
  export default WebSocket;
}
