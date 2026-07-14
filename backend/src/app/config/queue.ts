import { awsConfig } from './aws';

// Laravel-style queue configuration types
export interface QueueConnection {
  driver: string;
  [key: string]: any;
}

export interface QueueConnections {
  sqs: {
    driver: 'sqs';
    key: string | undefined;
    secret: string | undefined;
    prefix: string;
    queue: string;
    suffix: string;
    region: string;
    after_commit: boolean;
  };
  redis: {
    driver: 'redis';
    connection: string;
    queue: string;
    retry_after: number;
    block_for: number | null;
    after_commit: boolean;
  };
  database: {
    driver: 'database';
    connection: string | undefined;
    table: string;
    queue: string;
    retry_after: number;
    after_commit: boolean;
  };
  sync: {
    driver: 'sync';
  };
}

export interface QueueSettings {
  connection: keyof QueueConnections;
  queue?: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}

// Laravel-style queue configuration (config/queue.php equivalent)
export const queueConfig = {
  // Default queue connection
  default: (process.env.QUEUE_CONNECTION || 'sqs') as keyof QueueConnections,

  // Queue connections (like Laravel's connections array)
  connections: {
    sqs: {
      driver: 'sqs' as const,
      key: awsConfig.awsAccessKey,
      secret: awsConfig.awsSecretKey,
      prefix: process.env.SQS_PREFIX || 'https://sqs.us-east-1.amazonaws.com/your-account-id',
      queue: process.env.SQS_QUEUE || 'default',
      suffix: process.env.SQS_SUFFIX || '',
      region: awsConfig.awsRegion,
      after_commit: false,
    },

    redis: {
      driver: 'redis' as const,
      connection: process.env.REDIS_QUEUE_CONNECTION || 'default',
      queue: process.env.REDIS_QUEUE || 'default',
      retry_after: Number.parseInt(process.env.REDIS_QUEUE_RETRY_AFTER || '90', 10),
      block_for: null,
      after_commit: false,
    },

    database: {
      driver: 'database' as const,
      connection: process.env.DB_QUEUE_CONNECTION,
      table: process.env.DB_QUEUE_TABLE || 'jobs',
      queue: process.env.DB_QUEUE || 'default',
      retry_after: Number.parseInt(process.env.DB_QUEUE_RETRY_AFTER || '90', 10),
      after_commit: false,
    },

    sync: {
      driver: 'sync' as const,
    },
  } as QueueConnections,

  // Job batching (Laravel 8+ feature)
  batching: {
    database: process.env.DB_CONNECTION || 'sqlite',
    table: 'job_batches',
  },

  // Failed job configuration
  failed: {
    driver: process.env.QUEUE_FAILED_DRIVER || 'database-uuids',
    database: process.env.DB_CONNECTION || 'sqlite',
    table: 'failed_jobs',
  },

  // Queue-specific settings
  queues: {
    'question-validation': {
      connection: 'sqs' as const,
      queue: process.env.QUESTION_VALIDATION_QUEUE_URL || process.env.SQS_QUEUE || 'question-validation',
      timeout: 300, // 5 minutes
      retries: 3,
      retryDelay: 60, // 1 minute between retries
    } as QueueSettings,
    
    'default': {
      connection: 'sqs' as const,
      queue: process.env.SQS_QUEUE || 'default',
      timeout: 60,
      retries: 3,
      retryDelay: 30,
    } as QueueSettings,
  },
};

export default queueConfig;
