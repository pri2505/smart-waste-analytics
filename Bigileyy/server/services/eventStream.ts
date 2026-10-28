import { Response } from 'express';

interface Client {
  id: string;
  res: Response;
}

class EventStreamManager {
  private clients: Client[] = [];

  public addClient(id: string, res: Response) {
    this.clients.push({ id, res });
    // Keep connection alive with periodic ping
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId: id, timestamp: new Date().toISOString() })}\n\n`);

    res.on('close', () => {
      this.removeClient(id);
    });
  }

  public removeClient(id: string) {
    this.clients = this.clients.filter(c => c.id !== id);
  }

  public broadcast(eventType: string, payload: any) {
    const data = JSON.stringify({
      type: eventType,
      data: payload,
      timestamp: new Date().toISOString()
    });

    for (const client of this.clients) {
      try {
        client.res.write(`data: ${data}\n\n`);
      } catch (err) {
        console.error(`[SSE] Failed to send to client ${client.id}:`, err);
      }
    }
  }

  public getConnectedCount(): number {
    return this.clients.length;
  }
}

export const eventStream = new EventStreamManager();
