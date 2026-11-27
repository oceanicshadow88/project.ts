import Anthropic, { ClientOptions } from '@anthropic-ai/sdk';
import { CLAUDE_API_KEY } from '../config/claudeAi';
import type { TicketTitleValidationResult } from '../types/ticketTitleValidationResult';
import type { ChatIntentResult, ChatOptionNames } from '../types/chatIntentResult';
import { validateTicketTitleResult } from '../validations/ticketTitleResultValidation';
import { validateChatIntentResult } from '../validations/chatIntentResultValidation';

const VALIDATION_RULES = `
Objective

Evaluate and improve a TechScrum ticket title and classify the original title as
exactly one of: clear, unclear, or ambiguous.

Context

Ticket titles are used by developers to understand the work that needs to be
completed. A title should provide enough information for a developer to
understand the expected task without requiring essential clarification.

SPIKE tickets focus on investigation and planning.

Validation rules

- Clear: The action, target, and objective or expected work are understandable.
- Unclear: Essential information is missing, such as the intended action or
  objective.
- Ambiguous: The general task is identifiable, but its scope, target, or
  expected work could have multiple interpretations.

Examples

- Clear: (FEATURE) Add password visibility toggle to the login form.
- Unclear: (BUG) Fix login issue.
- Ambiguous: (SPIKE) Review project documentation and identify possible
  improvements.

Always include a recommendedTitle and a reason. For a clear title, preserve the
original title as recommendedTitle and explain why it is clear. For an unclear
or ambiguous title, recommend a more actionable title using only information
in the original title. Do not create new requirements, causes, or implementation
details. Explain the missing or ambiguous information and the improvement.

Do not judge a title by length or grammar alone.

Return JSON only, using this structure:

{"classification":"clear|unclear|ambiguous","recommendedTitle":"recommended ticket title","reason":"explanation"}
`;

const CHAT_INTENT_RULES = `
Objective

Decide what a TechScrum user wants from one chat message and extract the
details.

Intents

- create: the user wants a new ticket.
- search: the user wants to find or list existing tickets.
- other: anything else, including editing, deleting, estimating, or questions
  about TechScrum.

Rules

- Use only information in the message. Do not invent values.
- Choose type, assignee and sprint names only from the given options. Use ""
  when none match.
- Use "me" when the user means themselves and "current" for the current sprint.
- In search, use "unassigned" for tickets with no assignee.
- priority is one of Highest, High, Medium, Low, Lowest, or "".
- For create, write a short, actionable title and put any extra detail in
  description.

Return JSON only, using this structure:

{"intent":"create|search|other","ticket":{"title":"","type":"","priority":"","assignee":"","sprint":"","description":""},"search":{"keyword":"","type":"","priority":"","assignee":"","sprint":""}}
`;

const CHAT_TIMEOUT_MS = 25000;

// Claude sometimes wraps the JSON in a json code fence
const parseJsonReply = (response: Anthropic.Message, missingMessage: string): unknown => {
  const textBlock = response.content.find(
    (block) => block.type === 'text',
  );

  if (!textBlock) {
    throw new Error(missingMessage);
  }

  const json = textBlock.text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/```$/, '')
    .trim();

  return JSON.parse(json);
};

const createClaudeClient = (options: Omit<ClientOptions, 'apiKey'> = {}) => {
  const model = process.env.MCP_CLAUDE_MODEL;

  if (!CLAUDE_API_KEY || !model) {
    throw new Error(
      'Missing CLAUDE_API_KEY or MCP_CLAUDE_MODEL',
    );
  }

  return { model, anthropic: new Anthropic({ apiKey: CLAUDE_API_KEY, ...options }) };
};

export const validateTicketTitleByClaude = async (title: string): Promise<TicketTitleValidationResult> => {
  const { anthropic, model } = createClaudeClient();
  const response = await anthropic.messages.create({
    model,
    max_tokens: 300,
    temperature: 0,
    system: VALIDATION_RULES,
    messages: [
      {
        role: 'user',
        content: JSON.stringify({
          ticketTitle: title,
        }),
      },
    ],
  });

  return validateTicketTitleResult(
    parseJsonReply(response, 'Claude did not return a ticket title validation result'),
  );
};

export const detectChatIntentByClaude = async (
  message: string,
  options: ChatOptionNames,
): Promise<ChatIntentResult> => {
  // Answer before the frontend gives up at 30 seconds; the SDK would otherwise retry twice
  const { anthropic, model } = createClaudeClient({ timeout: CHAT_TIMEOUT_MS, maxRetries: 0 });
  const response = await anthropic.messages.create({
    model,
    max_tokens: 1000,
    temperature: 0,
    system: CHAT_INTENT_RULES,
    messages: [
      {
        role: 'user',
        content: JSON.stringify({ message, options }),
      },
    ],
  });

  if (response.stop_reason === 'max_tokens') {
    throw new Error('Claude chat intent reply was cut off');
  }
  if (response.stop_reason === 'refusal') {
    return validateChatIntentResult({ intent: 'other' });
  }

  return validateChatIntentResult(
    parseJsonReply(response, 'Claude did not return a chat intent'),
  );
};
