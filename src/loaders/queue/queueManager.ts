import { ConnectorInterface } from './connectors/connectorInterface';
import { QueueContract } from './contracts/queue';
import { SqsConnector } from './connectors/sqsConnector';

/**
 * Laravel: Illuminate\Queue\QueueManager
 */
export class QueueManager {
  private readonly connections: Record<string, QueueContract> = {};

  private readonly connectors: Record<string, () => ConnectorInterface> = {};

  constructor() {
    // Register default connectors
    this.registerConnectors();
  }

  /**
   * Register queue connectors (Laravel-style)
   */
  private registerConnectors(): void {
    // Register SQS connector
    this.addConnector('sqs', () => new SqsConnector());
    
    // Future connectors can be added here:
    // this.addConnector('redis', () => new RedisConnector());
    // this.addConnector('database', () => new DatabaseConnector());
  }

  /**
   * Register a queue connector.
   */
  public addConnector(driver: string, resolver: () => ConnectorInterface): void {
    this.connectors[driver] = resolver;
  }

  /**
   * Resolve a queue connection instance.
   */
  public connection(name = 'sqs'): QueueContract {
    if (!this.connections[name]) {
      this.connections[name] = this.resolve(name);
    }

    return this.connections[name];
  }

  /**
   * Resolve a queue connection.
   */
  private resolve(name: string): QueueContract {
    const config = this.getConfig(name);

    if (!config) {
      throw new Error(`The [${name}] queue connection has not been configured.`);
    }

    const connector = this.getConnector(config.driver);
    const queue = connector.connect(config);
    
    return queue.setConnectionName(name);
  }

  /**
   * Get the connector for a given driver.
   */
  private getConnector(driver: string): ConnectorInterface {
    if (!this.connectors[driver]) {
      throw new Error(`No connector for [${driver}].`);
    }

    return this.connectors[driver]();
  }

  /**
   * Get the queue connection configuration.
   */
  private getConfig(name: string): Record<string, any> | null {
    // For now, return SQS config. Later this should come from your config
    if (name === 'sqs') {
      return {
        driver: 'sqs',
        key: process.env.AWS_ACCESS_KEY_ID,
        secret: process.env.AWS_SECRET_ACCESS_KEY,
        prefix: process.env.SQS_PREFIX || 'https://sqs.us-east-1.amazonaws.com/your-account-id',
        queue: process.env.SQS_QUEUE || 'default',
        region: process.env.AWS_REGION || 'us-east-1',
        suffix: process.env.SQS_SUFFIX || '',
      };
    }

    return null;
  }

  /**
   * Dynamically pass calls to the default connection.
   */
  public push(job: any, data?: any, queue?: string): Promise<any> {
    return this.connection().push(job, data, queue);
  }

  public later(delay: number, job: any, data?: any, queue?: string): Promise<any> {
    return this.connection().later(delay, job, data, queue);
  }
}