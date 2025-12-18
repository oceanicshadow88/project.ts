import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { QueueContract } from './contracts/queue';
import { winstonLogger } from '../logger';

/**
 * Laravel: Illuminate\Queue\SqsQueue
 */
export class SqsQueue implements QueueContract {
  private readonly sqs: SQSClient;

  private connectionName = '';

  constructor(
    private readonly key: string,
    private readonly secret: string,
    private readonly prefix: string,
    private readonly defaultQueue: string,
    private readonly region: string,
    private readonly suffix?: string,
  ) {
    this.sqs = new SQSClient({
      region: this.region,
      credentials: {
        accessKeyId: this.key,
        secretAccessKey: this.secret,
      },
    });
  }

  /**
   * Get the connection name for the queue.
   */
  public getConnectionName(): string {
    return this.connectionName;
  }

  /**
   * Set the connection name for the queue.
   */
  public setConnectionName(name: string): this {
    this.connectionName = name;
    return this;
  }

  /**
   * Push a new job onto the queue.
   */
  public async push(job: any, data: any = {}, queue?: string): Promise<any> {
    return this.pushRaw(this.createPayload(job, data), queue);
  }

  /**
   * Push a new job onto the queue after a delay.
   */
  public async later(delay: number, job: any, data: any = {}, queue?: string): Promise<any> {
    return this.pushRaw(this.createPayload(job, data), queue, delay);
  }

  /**
   * Pop the next job off of the queue.
   */
  public async pop(queue?: string): Promise<any> {
    const queueUrl = this.getQueueUrl(queue);
    
    const command = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 20,
      MessageAttributeNames: ['All'],
    });

    const result = await this.sqs.send(command);
    
    if (result.Messages && result.Messages.length > 0) {
      const message = result.Messages[0];
      
      return {
        messageId: message.MessageId,
        receiptHandle: message.ReceiptHandle,
        body: message.Body,
        attempts: Number.parseInt(message.Attributes?.ApproximateReceiveCount || '1', 10),
      };
    }

    return null;
  }

  /**
   * Delete a job from the queue.
   */
  public async deleteMessage(receiptHandle: string, queue?: string): Promise<void> {
    const queueUrl = this.getQueueUrl(queue);
    
    const command = new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    });

    await this.sqs.send(command);
  }

  /**
   * Get the size of the queue.
   */
  public async size(): Promise<number> {
    // SQS doesn't provide accurate size info, return 0
    return 0;
  }

  /**
   * Push a raw payload onto the queue.
   */
  private async pushRaw(payload: string, queue?: string, delay = 0): Promise<any> {
    const queueUrl = this.getQueueUrl(queue);
    
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: payload,
      DelaySeconds: delay,
    });

    const result = await this.sqs.send(command);
    
    winstonLogger.info('Job pushed to SQS queue', {
      queue: queue || this.defaultQueue,
      messageId: result.MessageId,
    });

    return result.MessageId;
  }

  /**
   * Get the queue URL.
   */
  private getQueueUrl(queue?: string): string {
    const queueName = queue || this.defaultQueue;
    return `${this.prefix}/${queueName}${this.suffix || ''}`;
  }

  /**
   * Create a payload string from the given job and data.
   */
  private createPayload(job: any, data: any): string {
    return JSON.stringify({
      displayName: job.constructor.name,
      job: job.constructor.name,
      data,
      attempts: 0,
    });
  }
}