import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/app';
import type { TicketTitleValidationResult } from '../types/ticketTitleValidationResult';
import { validateTicketTitleResult } from '../validations/ticketTitleResultValidation';

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

export const validateTicketTitle = async (title: string): Promise<TicketTitleValidationResult> => {
  const { claudeApiKey: apiKey, claudeModel: model } = config.mcp;

  if (!apiKey || !model) {
    throw new Error(
      'Missing MCP_CLAUDE_API_KEY or MCP_CLAUDE_MODEL',
    );
  }

  const anthropic = new Anthropic({ apiKey });
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

  const textBlock = response.content.find(
    (block) => block.type === 'text',
  );

  if (!textBlock) {
    throw new Error(
      'Claude did not return a ticket title validation result',
    );
  }

  const json = textBlock.text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/```$/, '')
    .trim();

  return validateTicketTitleResult(JSON.parse(json));
};
