/* eslint-disable no-console */
import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
} from '@aws-sdk/client-sqs';
import { Envelope } from './jobs/baseJob';
import { Application } from '../application';
import { SQSClient } from '@aws-sdk/client-sqs';
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


import path from 'node:path';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

/**
 * 1) 强校验 jobName：只允许字母/数字/下划线，且不能以数字开头（可选）
 *    你也可以允许 '-'，但我建议先别允许。
 */
export function assertSafeJobName(jobName: string) {
  // Allow camelCase job names like 'questionJob'
  // Pattern: starts with lowercase letter, followed by alphanumeric + underscores
  const ok = /^[a-z][a-zA-Z0-9_]*$/.test(jobName);
  if (!ok) throw new Error(`Invalid jobName: ${jobName}`);
}

/**
 * 2) 绝对路径 resolve + 强制在 jobsDir 内
 *    - jobsDirAbs: 绝对路径（例如 dist/jobs 或 src/jobs）
 *    - 返回：被允许的绝对文件路径（带扩展名）
 */
export async function resolveJobFilePath(jobsDirAbs: string, jobName: string) {
  const jobsDirReal = await fs.realpath(jobsDirAbs);

  // 先拼出“候选路径”（不带扩展名）
  const candidateBase = path.resolve(jobsDirReal, jobName);

  // containment check：必须仍在 jobsDir 里面
  // 这里用 path.relative 最稳，不要用 startsWith(字符串) 那种容易踩坑
  const rel = path.relative(jobsDirReal, candidateBase);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error('Path traversal detected');
  }

  // 支持的扩展：优先运行时实际存在的
  const candidates = [
    `${candidateBase}.ts`,  // dev (ts-node / tsx) - prioritize for development
    `${candidateBase}.js`,  // production (dist)
  ];

  for (const file of candidates) {
    try {
      const realFile = await fs.realpath(file);

      // 再做一次 containment：防止 symlink 把你带出 jobsDir
      const relFile = path.relative(jobsDirReal, realFile);
      if (relFile.startsWith('..') || path.isAbsolute(relFile)) {
        throw new Error('Symlink escape detected');
      }

      return realFile;
    } catch {
      // not found, try next
    }
  }

  throw new Error(`Job module not found for: ${jobName}`);
}

/**
 * 动态 import（ts-node compatible version）
 */
export async function safeImportJobModule(jobsDirAbs: string, jobName: string) {
  console.log('Importing job module:', jobsDirAbs, jobName);
  assertSafeJobName(jobName);

  const filePath = await resolveJobFilePath(jobsDirAbs, jobName);
  console.log('Resolved job file path:', filePath);
  
  // For ts-node, use require instead of dynamic import for .ts files
  if (filePath.endsWith('.ts')) {
    // Clear require cache to ensure fresh imports
    delete require.cache[require.resolve(filePath)];
    const mod = require(filePath);
    return mod;
  } else {
    // For .js files, use dynamic import
    const mod = await import(pathToFileURL(filePath).href);
    return mod;
  }
}

const JOBS_DIR = path.join(process.cwd(), 'src/app/jobs');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function main(app: Application) {
  
  // Initialize job provider

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
      for (const msg of res.Messages) {
        if (!msg.Body || !msg.ReceiptHandle) continue;
        // await sqs.send(
        //   new DeleteMessageCommand({
        //     QueueUrl: QUEUE_URL,
        //     ReceiptHandle: msg.ReceiptHandle,
        //   }),
        // );
        const envelope = JSON.parse(msg.Body) as Envelope;
        const mod = await safeImportJobModule(JOBS_DIR, envelope.data.jobName);
        
        // Look for the job class - try multiple naming conventions
        const JobCtor = mod.default ?? 
                       mod[envelope.data.jobName] ?? 
                       mod[envelope.data.jobName.charAt(0).toUpperCase() + envelope.data.jobName.slice(1)] ?? // questionJob -> QuestionJob
                       mod.QuestionJob; // Fallback to known class name
                       
        if (!JobCtor) {
          console.error('[worker] unknown job:', envelope.data.jobName, 'Available exports:', Object.keys(mod));
          // ❌ 不 delete，让它进 DLQ
          continue;
        }

        try {
          const job = new JobCtor(envelope.data.payload);
          await job.handle();

          //   // ✅ 成功才 delete
          await sqs.send(
            new DeleteMessageCommand({
              QueueUrl: QUEUE_URL,
              ReceiptHandle: msg.ReceiptHandle,
            }),
          );
        } catch (err) {
          console.error('[worker] job failed:', envelope.data.jobName, err);
          // ❌ 不 delete → SQS 自动重试
        }
      }
    } catch (err) {
      const code = (err as any)?.name ?? (err as any)?.Code;
      if (code !== 'QueueDoesNotExist' && code !== 'AWS.SimpleQueueService.NonExistentQueue') {
        console.error('[worker] poll error', err);
      }
      await sleep(2000); // 防止 tight loop
    }
  }
}
