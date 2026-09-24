import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/app';
import { ticketTitleValidationSchema, type TicketTitleValidationResult } from '../types/ticketTitleValidation';

const VALIDATION_RULES = `
Objective

Evaluate a TechScrum ticket title before ticket creation and classify it as
exactly one of: clear, unclear, or ambiguous.

Context

Ticket titles are used by developers to understand the work that needs to be
completed. A title should provide enough information for a developer to
understand the expected task without requiring essential clarification.

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

For a clear title, return only the classification.

For an unclear or ambiguous title, include a reason that identifies the
specific missing or ambiguous information.

Do not judge a title by length or grammar alone.

Return JSON only, using one of these structures:

{"classification":"clear"}

{"classification":"unclear","reason":"explanation"}

{"classification":"ambiguous","reason":"explanation"}
`;

export const validateTicketTitle = async (
  title: string,
): Promise<TicketTitleValidationResult> => {
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

  return ticketTitleValidationSchema.parse(JSON.parse(json));
};
