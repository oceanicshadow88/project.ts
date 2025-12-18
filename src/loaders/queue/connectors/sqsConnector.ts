import { ConnectorInterface } from './connectorInterface';
import { QueueContract } from '../contracts/queue';
import { SqsQueue } from '../sqsQueue';

/**
 * Laravel: Illuminate\Queue\Connectors\SqsConnector
 */
export class SqsConnector implements ConnectorInterface {
  /**
   * Establish a queue connection.
   */
  public connect(config: Record<string, any>): QueueContract {
    return new SqsQueue(
      config.key,
      config.secret,
      config.prefix,
      config.queue,
      config.region,
      config.suffix,
    );
  }
}