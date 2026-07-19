import { describe, expect, it } from 'vitest';
import { mapAIConversation, mapAIConversationPage } from './ai-mapper';

describe('ai-mapper', () => {
  it('maps conversation pages', () => {
    const mapped = mapAIConversationPage({
      items: [
        {
          id: '1',
          organizationId: '2',
          userId: '3',
          courseId: null,
          lessonId: null,
          assignmentId: null,
          feature: 'TUTOR',
          title: 'Test',
          provider: 'OPENAI',
          model: 'gpt-4o-mini',
          pinned: false,
          lastMessageAt: null,
          createdAt: '2026-07-19T00:00:00.000Z',
          updatedAt: '2026-07-19T00:00:00.000Z',
        },
      ],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
    expect(mapped.items).toHaveLength(1);
    expect(mapAIConversation(mapped.items[0])).toEqual(mapped.items[0]);
  });
});
