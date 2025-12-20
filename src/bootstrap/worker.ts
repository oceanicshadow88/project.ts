/* eslint-disable no-console */
import {
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';
import { Envelope } from './queue/jobs/baseJob';
import { Application } from './application';
import { SQSClient } from '@aws-sdk/client-sqs';
import { JobProvider } from '../app/providers/jobProvider';
const dotenv = require('dotenv');
dotenv.config();
const sqs = new SQSClient({ region: 'ap-southeast-2' });

const QUEUE_URL = process.env.SQS_QUEUE_URL!;
const MAX_MESSAGES = 1;              // 一次处理 1 条（最稳）
const WAIT_TIME_SECONDS = 20;         // long polling
const VISIBILITY_TIMEOUT = 60;        // job 最长执行时间（秒）

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const app = new Application();
  app.init();


  console.log('[worker] started');

  while (true) {
    try {
      const res = await sqs.send(
        new ReceiveMessageCommand({
          QueueUrl: QUEUE_URL,
          MaxNumberOfMessages: MAX_MESSAGES,
          WaitTimeSeconds: WAIT_TIME_SECONDS,
          VisibilityTimeout: VISIBILITY_TIMEOUT,
        }),
      );

      if (!res.Messages || res.Messages.length === 0) {
        continue; // long polling timeout, loop again
      }
      const jobProvider = new JobProvider(app);
      const registry = jobProvider.getRegistry();
      for (const msg of res.Messages) {
        if (!msg.Body || !msg.ReceiptHandle) continue;

        const envelope = JSON.parse(msg.Body) as Envelope;
    
        const JobCtor = registry[envelope.jobName];
        if (!JobCtor) {
          console.error('[worker] unknown job:', envelope.jobName);
          // ❌ 不 delete，让它进 DLQ
          continue;
        }

        try {
          const job = new JobCtor(envelope.payload);
          await job.handle();

        //   // ✅ 成功才 delete
        //   await sqs.send(
        //     new DeleteMessageCommand({
        //       QueueUrl: QUEUE_URL,
        //       ReceiptHandle: msg.ReceiptHandle,
        //     }),
        //   );

          console.log('[worker] job done:', envelope.jobName);
        } catch (err) {
          console.error('[worker] job failed:', envelope.jobName, err);
          // ❌ 不 delete → SQS 自动重试
        }
      }
    } catch (err) {
      console.error('[worker] poll error', err);
      await sleep(2000); // 防止 tight loop
    }
  }
}

main().catch((err) => {
  console.error('[worker] fatal error', err);
  process.exit(1);
});
