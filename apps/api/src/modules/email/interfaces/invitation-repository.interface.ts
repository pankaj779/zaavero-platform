import type { InvitationType } from '../dto/invitation.dto';

export interface InvitationRecord {
  id: string;
  organizationId: string;
  invitedById: string | null;
  acceptedById: string | null;
  email: string;
  role: string;
  type: InvitationType;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
  tokenHash: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInvitationData {
  organizationId: string;
  invitedById: string;
  email: string;
  role: string;
  type: InvitationType;
  tokenHash: string;
  expiresAt: Date;
}

export interface AcceptInvitationData {
  invitationId: string;
  passwordHash?: string;
  firstName?: string;
  lastName?: string;
}

export interface InvitationRepository {
  create(data: CreateInvitationData): Promise<InvitationRecord>;
  listByOrganization(
    organizationId: string,
    types?: InvitationRecord['type'][],
  ): Promise<InvitationRecord[]>;
  findById(id: string): Promise<InvitationRecord | null>;
  findByTokenHash(tokenHash: string): Promise<InvitationRecord | null>;
  rotateToken(id: string, tokenHash: string, expiresAt: Date): Promise<InvitationRecord>;
  revoke(id: string): Promise<InvitationRecord>;
  expire(id: string): Promise<void>;
  roleExists(role: string): Promise<boolean>;
  organizationExists(id: string): Promise<boolean>;
  userExists(email: string): Promise<boolean>;
  accept(data: AcceptInvitationData): Promise<{ invitation: InvitationRecord; userId: string }>;
}
