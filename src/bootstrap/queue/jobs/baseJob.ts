import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({ region: process.env.AWS_REGION ?? 'ap-southeast-2' });



export type Envelope = {
  uuid: string;
  displayName: string; // e.g. "App\\Jobs\\SendEmailJob"
  job: string;         // e.g. "Illuminate\\Queue\\CallQueuedHandler@call"
  sentAt: number,
  version: 1;
  maxTries: number | null;
  maxExceptions: number | null;
  failOnTimeout: boolean;
  backoff: number | number[] | null;
  timeout: number | null;
  retryUntil: number | null; // unix timestamp or null

  data: {
    jobName: string; // e.g. "App\\Jobs\\SendEmailJob"
    payload: unknown;     // PHP serialized string
  };
};

export type DispatchOptions = {
  queueUrl?: string;
  delaySeconds?: number;
  messageGroupId?: string;      // FIFO 用
  messageDeduplicationId?: string; // FIFO 用
};

export abstract class BaseJob<TPayload> {
  public readonly payload: TPayload;

  // Abstract static property for job name
  static readonly jobName: string;

  protected constructor(payload: TPayload) {
    this.payload = payload;
  }

  abstract handle(): Promise<void>;

  /**
   * 静态 dispatch：类名.dispatch()
   * 注意：static 里用 this，就能拿到子类的 jobName
   */
  static async dispatch<TPayload>(
    this: { jobName: string }, 
    payload: TPayload,
    opts: DispatchOptions = {},
  ): Promise<string> {
    const queueUrl = opts.queueUrl ?? process.env.SQS_QUEUE_URL;
    if (!queueUrl) throw new Error('Missing SQS_QUEUE_URL (or pass opts.queueUrl)');

    const body: Envelope = {
      uuid: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      displayName: this.jobName,
      job: 'CallQueuedHandler@call',
      sentAt: Date.now(),
      version: 1,
      maxTries: 3,
      maxExceptions: null,
      failOnTimeout: false,
      backoff: null,
      timeout: null,
      retryUntil: null,
      data: {
        jobName: this.jobName,
        payload,
      },
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