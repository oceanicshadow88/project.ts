import { Application } from '../../bootstrap/application';
import { QuestionJob } from '../jobs/questionJob';

export const JOBS = {
  Registry: Symbol('JobRegistry'),
};

export type JobCtor = new (payload: any) => { handle(): Promise<void> };

export class JobProvider  {
  constructor(app: Application) {
    app.addInstance<typeof QuestionJob>('registry', QuestionJob);
  }

  getRegistry(): Record<string, JobCtor> {
    return {
      [QuestionJob.name]: QuestionJob,
    };
  }
}