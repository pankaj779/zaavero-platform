import type {
  ConversationParticipantResponseDto,
  ConversationResponseDto,
  MessageResponseDto,
} from '../dto/messaging-response.dto';
import type {
  ConversationParticipantRecord,
  ConversationWithParticipantsRecord,
  MessageRecord,
} from '../interfaces/messaging-repository.interface';

export class MessagingMapper {
  static toParticipantResponse(
    record: ConversationParticipantRecord,
  ): ConversationParticipantResponseDto {
    return {
      id: record.id,
      organizationId: record.organizationId,
      conversationId: record.conversationId,
      userId: record.userId,
      joinedAt: record.joinedAt.toISOString(),
      lastReadAt: record.lastReadAt ? record.lastReadAt.toISOString() : null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  static toConversationResponse(
    record: ConversationWithParticipantsRecord,
  ): ConversationResponseDto {
    return {
      id: record.id,
      organizationId: record.organizationId,
      type: record.type,
      title: record.title,
      participants: record.participants.map((participant) =>
        MessagingMapper.toParticipantResponse(participant),
      ),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  static toConversationResponseList(
    records: ConversationWithParticipantsRecord[],
  ): ConversationResponseDto[] {
    return records.map((record) => MessagingMapper.toConversationResponse(record));
  }

  static toMessageResponse(record: MessageRecord): MessageResponseDto {
    return {
      id: record.id,
      organizationId: record.organizationId,
      conversationId: record.conversationId,
      senderId: record.senderId,
      body: record.body,
      attachments: record.attachments,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      deletedAt: record.deletedAt ? record.deletedAt.toISOString() : null,
    };
  }

  static toMessageResponseList(records: MessageRecord[]): MessageResponseDto[] {
    return records.map((record) => MessagingMapper.toMessageResponse(record));
  }
}
