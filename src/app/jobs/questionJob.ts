/* eslint-disable no-console */
import { BaseJob } from '../../bootstrap/queue/jobs/baseJob';
import * as Prompt from '../model/prompt';
import * as Question from '../model/question';
import * as Ticket from '../model/ticket';
import { analyzeAndProcessTitle } from '../services/openAiService';
import { tenantDBConnection } from '../database/connections';

export type TempPayload = { 
  questionId: string; 
  ticketId: string; 
  tenantId: string; 
};

export class QuestionJob extends BaseJob<TempPayload> {
  static readonly jobName = 'questionJob'; // Custom job name

  async handle() {
    try {
      // Get tenant-specific database connection
      const connection = await tenantDBConnection(this.payload.tenantId);
      
      // Get model instances for this tenant
      const promptModel = Prompt.getModel(connection);
      const questionModel = Question.getModel(connection);
      const ticketModel = Ticket.getModel(connection);
      
      // Find the system prompt for questions
      const systemPrompt = await promptModel.findOne({ title: 'question' });
      const combinedPrompt = systemPrompt?.prompt + `Evaluate the ticket and respond with: 
        - isClear: Yes / No
        - Reasoning: Brief explanation, explicitly referencing alignment between title and question
        - Clarity Score: 1–5 (1 = very unclear, 5 = very clear)
        - Alignment Score: 1–5 (1 = completely unrelated, 5 = perfectly aligned)
        - Suggestions (if unclear or misaligned): How the title or question could be improved to form a coherent ticket`;
      if (!systemPrompt) {
        console.warn(`[QuestionJob] No system prompt found with title 'question' for tenant ${this.payload.tenantId}`);
        return;
      }

      const ticket = await ticketModel.findById(this.payload.ticketId);
      if (!ticket) {
        console.warn(`[QuestionJob] Ticket not found: ${this.payload.ticketId}`);
        return;
      }
      // Find the question to process
      const question = await questionModel.findById(this.payload.questionId);
      if (!question) {
        console.warn(`[QuestionJob] Question not found: ${this.payload.questionId}`);
        return;
      }
      
      // Combine question title with additional title data for AI processing
      const combinedTitle = 'Ticket title:' + ticket.title + ', Question:' + question.title;

      // Call AI service to analyze and process the title
      console.log(`[QuestionJob] Processing with AI: "${combinedTitle}"`);
      console.log(`[QuestionJob] Using system prompt: "${combinedPrompt}"`);

      const aiResult = await analyzeAndProcessTitle(combinedTitle, combinedPrompt);
      console.log('[QuestionJob] AI processing result:', aiResult);
  
      question.isClear = aiResult.structured.isClear === 'Yes' ? true : false; 
      question.assignee = undefined;
      question.waitingForStakeholder = false;
      question.messages = [aiResult.structured.Reasoning + ' ' + aiResult.structured.Suggestions];

      question.save();
      // Here you could update the question with AI results if needed
      // await questionModel.findByIdAndUpdate(this.payload.questionId, {
      //   aiAnalysis: aiResult,
      //   processedAt: new Date()
      // });
      
    } catch (error) {
      console.error(`[QuestionJob] Error processing questionId=${this.payload.questionId}:`, error);
      throw error; // Re-throw to trigger job retry mechanism
    }

    console.log('[QuestionJob] Processing completed successfully');
  }
}