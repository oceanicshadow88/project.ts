import { BaseJob } from "../../bootstrap/queue/jobs/baseJob";
import * as Prompt from "../model/prompt";
import * as Question from "../model/question";
import { analyzeAndProcessTitle } from "../services/openAiService";
import { tenantDBConnection } from "../database/connections";

export type TempPayload = { 
  questionId: string; 
  ticketTitle: string; 
  tenantId: string; 
};

export class QuestionJob extends BaseJob<TempPayload> {
  static readonly jobName = 'questionJob'; // Custom job name

  constructor(payload: TempPayload) {
    super(payload);
  }

  async handle() {
    console.log(`[QuestionJob] Handling questionId=${this.payload.questionId}`);
    console.log(`[QuestionJob] Title: ${this.payload.ticketTitle}`);
    console.log(`[QuestionJob] TenantId: ${this.payload.tenantId}`);
    
    try {
      // Get tenant-specific database connection
      const connection = await tenantDBConnection(this.payload.tenantId);
      
      // Get model instances for this tenant
      const promptModel = Prompt.getModel(connection);
      const questionModel = Question.getModel(connection);
      
      // Find the system prompt for questions
      const systemPrompt = await promptModel.findOne({ title: 'question' });
      if (!systemPrompt) {
        console.warn(`[QuestionJob] No system prompt found with title 'question' for tenant ${this.payload.tenantId}`);
        return;
      }
      
      // Find the question to process
      const question = await questionModel.findById(this.payload.questionId);
      if (!question) {
        console.warn(`[QuestionJob] Question not found: ${this.payload.questionId}`);
        return;
      }
      
      // Combine question title with additional title data for AI processing
      const combinedTitle = "Ticket title:" + this.payload.ticketTitle + 'Question:' + question.title;

      // Call AI service to analyze and process the title
      console.log(`[QuestionJob] Processing with AI: "${combinedTitle}"`);
      console.log(`[QuestionJob] Using system prompt: "${systemPrompt.prompt}"`);
      
      const aiResult = await analyzeAndProcessTitle(combinedTitle, systemPrompt.prompt);
      console.log(`[QuestionJob] AI processing result:`, aiResult);
      
      // Here you could update the question with AI results if needed
      // await questionModel.findByIdAndUpdate(this.payload.questionId, {
      //   aiAnalysis: aiResult,
      //   processedAt: new Date()
      // });
      
    } catch (error) {
      console.error(`[QuestionJob] Error processing questionId=${this.payload.questionId}:`, error);
      throw error; // Re-throw to trigger job retry mechanism
    }

    console.log(`[QuestionJob] Processing completed successfully`);
  }
}