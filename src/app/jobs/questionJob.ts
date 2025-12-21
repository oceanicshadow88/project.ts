import { BaseJob } from "../../bootstrap/queue/jobs/baseJob";


export type TempPayload = { questionId: string; };

export class QuestionJob extends BaseJob<TempPayload> {
  static readonly jobName = 'questionJob'; // Custom job name

  constructor(payload: TempPayload) {
    super(payload);
  }

  async handle() {
    console.log(`[QuestionJob] Handling questionId=${this.payload.questionId}`);
    // 做你要的事
    // this.payload.questionId ...
  }
}