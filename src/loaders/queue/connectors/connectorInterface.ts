import { QueueContract } from '../contracts/queue';

/**
 * Laravel: Illuminate\Queue\Connectors\ConnectorInterface
 */
export interface ConnectorInterface {
  /**
   * Establish a queue connection.
   */
  connect(config: Record<string, any>): QueueContract;
}