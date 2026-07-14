export interface UserStoryValidationResponse {
  success: boolean;
  title: string;
  response: string;
  structured: {
    title: {
      state: 'pass' | 'needs_more_context' | 'fail';
      feedback: string | string[];
    };
    description: {
      state: 'pass' | 'needs_more_context' | 'fail';
      feedback: string | string[];
    };
  };
  tipTapContent: {
    type: string;
    content: any[];
  };
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    prompt_tokens_details: {
      cached_tokens: number;
      audio_tokens: number;
    };
    completion_tokens_details: {
      reasoning_tokens: number;
      audio_tokens: number;
      accepted_prediction_tokens: number;
      rejected_prediction_tokens: number;
    };
  };
}

export interface FeedbackQuestion {
  question: string;
  answer: string;
}
