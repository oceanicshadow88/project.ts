import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({ region: process.env.AWS_REGION ?? 'ap-southeast-2' });

export type Envelope = {
  jobName: string;
  payload: unknown;
  sentAt: number,
  version: 1;
};


export type DispatchOptions = {
  queueUrl?: string;
  delaySeconds?: number;
  messageGroupId?: string;      // FIFO 用
  messageDeduplicationId?: string; // FIFO 用
};

export abstract class BaseJob<TPayload> {
  public readonly payload: TPayload;

  protected constructor(payload: TPayload) {
    this.payload = payload;
  }

  abstract handle(): Promise<void>;

  /**
   * 静态 dispatch：类名.dispatch()
   * 注意：static 里用 this，就能拿到子类的 name
   */
  static async dispatch<TPayload>(
    this: { name: string }, 
    payload: TPayload,
    opts: DispatchOptions = {},
  ): Promise<string> {
    const queueUrl = opts.queueUrl ?? process.env.SQS_QUEUE_URL;
    if (!queueUrl) throw new Error('Missing SQS_QUEUE_URL (or pass opts.queueUrl)');

    const body: Envelope = {
      jobName: this.name,
      payload,
      sentAt: Date.now(),
      version: 1,
    };

    const cmd = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(body),
      DelaySeconds: opts.delaySeconds,
      MessageGroupId: opts.messageGroupId,
      MessageDeduplicationId: opts.messageDeduplicationId,
    });

    const res = await sqs.send(cmd);
    if (!res.MessageId) throw new Error('SQS sendMessage returned no MessageId');
    return res.MessageId;
  }
}