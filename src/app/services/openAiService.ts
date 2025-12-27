import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const analyzeAndProcessTitle = async (
  ticketTitle: string,
  systemPrompt: string,
) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const userPrompt = `Analyze this question:\n\nTitle: "${ticketTitle}"
    }\n\nRespond with ONLY the JSON structure specified in the system prompt.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-1106-preview',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      max_tokens: 1500,
      temperature: 0.1,
    });

    const responseContent = completion.choices[0]?.message?.content || 'No response generated';

    // Try to parse the JSON response directly since we're using json_object mode
    let structuredResponse;
    try {
      // First try to parse the entire response as JSON
      structuredResponse = JSON.parse(responseContent);
    } catch {
      try {
        // Fallback: try to extract JSON from the response
        const regex = /\{[\s\S]*\}/;
        const jsonMatch = regex.exec(responseContent);
        if (jsonMatch) {
          structuredResponse = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // If all parsing fails, create a fallback structure
        structuredResponse = {
          isClear: false,
          action: 'improve_title',
          sections: [
            {
              heading: 'Parsing Error',
              content: 'Failed to parse OpenAI response. Please try again.',
              type: 'paragraph',
            },
          ],
          feedback: 'OpenAI response could not be parsed as JSON',
        };
      }
    }

    return {
      success: true,
      title: ticketTitle,
      response: responseContent,
      structured: structuredResponse,
      usage: completion.usage,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to analyze and process title',
    };
  }
};
