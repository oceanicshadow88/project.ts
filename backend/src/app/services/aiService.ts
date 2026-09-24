import Anthropic from '@anthropic-ai/sdk';
import { ToolUseBlock } from '@anthropic-ai/sdk/resources/messages';
import { CLAUDE_API_KEY } from '../config/claudeAi';
import { getSystemPrompt, getToolChoice, getTools } from '../utils/aiUtils';

const anthropic = new Anthropic({
  apiKey: CLAUDE_API_KEY,
});

export interface QuestionClarityResult {
  isClear: boolean;
  reasoning: string;
  clarityScore: number;
  alignmentScore: number;
  suggestions: string;
}

export const questionClarityCheck = async (
  combinedTitle: string,
  systemPrompt: string,
  model: string,
) => {
  const messageParams: any = {
    model: model,
    max_tokens: 2000,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: combinedTitle,
      },
    ],
    tools: getTools('questionClarityCheck'),
    tool_choice: getToolChoice('questionClarityCheck'),
  };

  const msg = await anthropic.messages.create(messageParams);
  const toolContent = msg.content.find((c) => c.type === 'tool_use') as ToolUseBlock;
  return toolContent?.input as QuestionClarityResult;
};

const optimizeTextByClaude = async (
  content: string,
  action: string,
  model: string,
): Promise<Anthropic.Message> => {
  const messageParams: any = {
    model: model,
    max_tokens: 4000,
    system: getSystemPrompt(action),
    messages: [
      {
        role: 'user',
        content: content,
      },
    ],
  };

  const tools = getTools(action);
  if (tools.length > 0) {
    messageParams.tools = tools;
    messageParams.tool_choice = getToolChoice(action);
  }

  const msg = await anthropic.messages.create(messageParams);
  return msg;
};

export const optimizeTextByClaudeWithRetry = async (
  content: string,
  action: string,
  retries = 3,
): Promise<Anthropic.Message> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await optimizeTextByClaude(content, action, 'claude-sonnet-5');
    } catch (error: any) {
      if (error.status === 529 && i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
};


