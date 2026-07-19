export const AI_PROVIDERS = [
  'OPENAI',
  'AZURE_OPENAI',
  'ANTHROPIC',
  'GOOGLE_GEMINI',
  'OLLAMA',
  'OPENROUTER',
  'GROQ',
  'SANDBOX',
] as const;
export type AIProviderValue = (typeof AI_PROVIDERS)[number];

export const AI_FEATURES = [
  'TUTOR',
  'LESSON_SUMMARY',
  'ASSIGNMENT_HELP',
  'QUIZ_GENERATOR',
  'FLASHCARDS',
  'COURSE_DESCRIPTION',
  'CERTIFICATE_FEEDBACK',
  'ANNOUNCEMENT_WRITER',
  'EMAIL_WRITER',
  'PERFORMANCE_INSIGHTS',
  'ADMIN_INSIGHTS',
  'SEMANTIC_SEARCH',
  'GENERAL',
] as const;
export type AIFeatureValue = (typeof AI_FEATURES)[number];

export const AI_MESSAGE_ROLES = ['SYSTEM', 'USER', 'ASSISTANT', 'TOOL'] as const;
export type AIMessageRoleValue = (typeof AI_MESSAGE_ROLES)[number];

export const AI_FEEDBACK_RATINGS = ['UP', 'DOWN'] as const;
export type AIFeedbackRatingValue = (typeof AI_FEEDBACK_RATINGS)[number];

export const AI_AUDIT_ENTITY = 'AI';
export const AI_AUDIT_ACTIONS = {
  conversationCreated: 'ai.conversation.created',
  conversationDeleted: 'ai.conversation.deleted',
  messageGenerated: 'ai.message.generated',
  feedbackSubmitted: 'ai.feedback.submitted',
  documentIndexed: 'ai.document.indexed',
  quotaExceeded: 'ai.quota.exceeded',
  jobCompleted: 'ai.job.completed',
  jobFailed: 'ai.job.failed',
} as const;

export const DEFAULT_CHAT_MODEL = 'gpt-4o-mini';
export const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';
export const DEFAULT_EMBEDDING_DIMENSIONS = 1536;
export const DEFAULT_CHUNK_SIZE = 800;
export const DEFAULT_CHUNK_OVERLAP = 120;
export const DEFAULT_RETRIEVAL_TOP_K = 6;
