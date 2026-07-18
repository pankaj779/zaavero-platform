import {
  ForbiddenException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hash, verify } from 'argon2';
import type { ControllerSuccessPayload } from '../../../common/interfaces/api-response.interface';
import type { EnvConfig } from '../../../config/env.schema';
import { BusinessEmailService } from '../../email/services/business-email.service';
import { StorageService } from '../../storage/services/storage.service';
import {
  DEFAULT_ORGANIZATION,
  DEFAULT_REGISTRATION_ROLE,
  EMAIL_VERIFICATION_EXPIRY_HOURS,
  PASSWORD_RESET_EXPIRY_MINUTES,
} from '../constants/auth.constants';
import { AUTH_REPOSITORY, USER_REPOSITORY } from '../constants/injection-tokens';
import type { ForgotPasswordDto } from '../dto/forgot-password.dto';
import type { LoginDto } from '../dto/login.dto';
import type { LogoutDto } from '../dto/logout.dto';
import type { RefreshTokenDto } from '../dto/refresh-token.dto';
import type { RegisterDto } from '../dto/register.dto';
import type { ResendVerificationDto } from '../dto/resend-verification.dto';
import type { ResetPasswordDto } from '../dto/reset-password.dto';
import type { UpdateAvatarDto } from '../dto/update-avatar.dto';
import type { VerifyEmailDto } from '../dto/verify-email.dto';
import {
  AccountDisabledException,
  EmailAlreadyExistsException,
  InvalidCredentialsException,
  PhoneAlreadyExistsException,
  TokenExpiredException,
  TokenInvalidException,
} from '../exceptions';
import type { AuthRepository } from '../interfaces/auth-repository.interface';
import type { UserRepository } from '../interfaces/user-repository.interface';
import type { AuthenticatedUser } from '../types/authenticated-user.type';
import type { LoginResponseData, RefreshResponseData } from '../types/login-response.type';
import type { RegisterResponseData } from '../types/register-response.type';
import {
  generateEmailVerificationToken,
  hashEmailVerificationToken,
} from '../utils/email-verification-token.util';
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
} from '../utils/password-reset-token.util';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  private dummyPasswordHashPromise?: Promise<string>;

  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: AuthRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
    private readonly emailService: BusinessEmailService,
    private readonly configService: ConfigService<EnvConfig, true>,
    private readonly storageService?: StorageService,
  ) {}

  getRepositoryMarkers(): { auth: AuthRepository['marker']; user: UserRepository['marker'] } {
    return {
      auth: this.authRepository.marker,
      user: this.userRepository.marker,
    };
  }

  async getCurrentUser(authenticatedUser: AuthenticatedUser): Promise<
    ControllerSuccessPayload<
      AuthenticatedUser & {
        firstName: string;
        lastName: string;
        phone: string | null;
        profileImage: string | null;
        emailVerified: boolean;
        isActive: boolean;
      }
    >
  > {
    const user = await this.userRepository.findById(authenticatedUser.id);
    if (user?.isActive !== true || user.deletedAt !== null) {
      throw new AccountDisabledException();
    }

    return {
      message: 'Current user retrieved successfully.',
      data: {
        ...authenticatedUser,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        profileImage: user.profileImage ?? null,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
      },
    };
  }

  async updateAvatar(
    user: AuthenticatedUser,
    dto: UpdateAvatarDto,
  ): Promise<ControllerSuccessPayload<{ profileImage: string | null }>> {
    if (!user.organizationIds.includes(dto.organizationId)) {
      throw new ForbiddenException('Organization access denied.');
    }
    if (!this.storageService || !this.userRepository.updateProfileImage) {
      throw new ServiceUnavailableException('Avatar storage is unavailable.');
    }
    const profileImage =
      dto.profileImage === null
        ? null
        : await this.storageService.resolveAssetUrl(dto.profileImage, {
            organizationId: dto.organizationId,
            entityType: 'USER_AVATAR',
            ownerUserId: user.id,
          });
    await this.userRepository.updateProfileImage(user.id, profileImage);
    return { message: 'Avatar updated successfully.', data: { profileImage } };
  }

  async register(dto: RegisterDto): Promise<ControllerSuccessPayload<RegisterResponseData>> {
    const existingByEmail = await this.userRepository.findByEmail(dto.email);
    if (existingByEmail) {
      throw new EmailAlreadyExistsException();
    }

    if (dto.phone) {
      const existingByPhone = await this.userRepository.findByPhone(dto.phone);
      if (existingByPhone) {
        throw new PhoneAlreadyExistsException();
      }
    }

    const passwordHash = await hash(dto.password);

    const registered = await this.authRepository.registerUser({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      organizationSlug: DEFAULT_ORGANIZATION.slug,
      roleName: DEFAULT_REGISTRATION_ROLE,
    });

    await this.issueAndQueueVerificationEmail({
      userId: registered.userId,
      email: registered.email,
      firstName: dto.firstName,
    });

    return {
      message: 'Registration successful. Please verify your email.',
      data: {
        userId: registered.userId,
        email: registered.email,
        organization: registered.organizationName,
      },
    };
  }

  async login(dto: LoginDto): Promise<ControllerSuccessPayload<LoginResponseData>> {
    const user = await this.userRepository.findByEmail(dto.email);
    const passwordValid = await this.verifyPassword(user?.passwordHash ?? null, dto.password);

    if (!user || !passwordValid) {
      throw new InvalidCredentialsException();
    }

    if (!user.isActive || user.deletedAt !== null) {
      throw new AccountDisabledException();
    }

    const tokens = await this.tokenService.createTokenPair({
      id: user.id,
      email: user.email,
    });

    await this.authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: tokens.refreshTokenHash,
      expiresAt: tokens.refreshTokenExpiresAt,
    });

    return {
      message: 'Login successful.',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      },
    };
  }

  async refresh(dto: RefreshTokenDto): Promise<ControllerSuccessPayload<RefreshResponseData>> {
    const tokenHash = this.tokenService.hashIncomingRefreshToken(dto.refreshToken);
    const existing = await this.authRepository.findRefreshTokenByHash(tokenHash);

    if (!existing) {
      throw new TokenInvalidException('Refresh token is invalid.');
    }

    if (existing.revokedAt !== null) {
      await this.authRepository.revokeAllRefreshTokensForUser(existing.userId);
      throw new TokenInvalidException('Refresh token is invalid.');
    }

    if (existing.expiresAt.getTime() <= Date.now()) {
      await this.authRepository.revokeRefreshToken(existing.id);
      throw new TokenExpiredException('Refresh token has expired.');
    }

    const user = await this.userRepository.findById(existing.userId);
    if (!user || !user.isActive || user.deletedAt !== null) {
      await this.authRepository.revokeAllRefreshTokensForUser(existing.userId);
      throw new TokenInvalidException('Refresh token is invalid.');
    }

    const tokens = await this.tokenService.createTokenPair({
      id: user.id,
      email: user.email,
    });

    await this.authRepository.rotateRefreshToken({
      currentTokenId: existing.id,
      userId: user.id,
      newTokenHash: tokens.refreshTokenHash,
      newExpiresAt: tokens.refreshTokenExpiresAt,
    });

    return {
      message: 'Token refreshed successfully.',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      },
    };
  }

  async logout(dto: LogoutDto): Promise<ControllerSuccessPayload<null>> {
    const tokenHash = this.tokenService.hashIncomingRefreshToken(dto.refreshToken);
    const existing = await this.authRepository.findRefreshTokenByHash(tokenHash);

    if (existing?.revokedAt === null) {
      await this.authRepository.revokeRefreshToken(existing.id);
    }

    return {
      message: 'Logged out successfully.',
      data: null,
    };
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<ControllerSuccessPayload<{ email: string }>> {
    const tokenHash = hashEmailVerificationToken(dto.token);
    const record = await this.authRepository.findEmailVerificationTokenByHash(tokenHash);

    if (!record) {
      throw new TokenInvalidException('Email verification token is invalid.');
    }

    if (record.expiresAt.getTime() <= Date.now()) {
      await this.authRepository.deleteEmailVerificationToken(record.id);
      throw new TokenExpiredException('Email verification token has expired.');
    }

    const user = await this.userRepository.findById(record.userId);
    if (!user || !user.isActive || user.deletedAt !== null) {
      throw new TokenInvalidException('Email verification token is invalid.');
    }

    if (!user.emailVerified) {
      await this.userRepository.markEmailVerified(user.id);
    }

    await this.authRepository.deleteEmailVerificationTokensForUser(user.id);
    await this.emailService.enqueueForUserPrimaryOrganization(user.id, {
      templateKey: 'welcome',
      actionPath: '/',
      entityType: 'user',
      entityId: user.id,
    });

    return {
      message: 'Email verified successfully.',
      data: {
        email: user.email,
      },
    };
  }

  async resendVerification(dto: ResendVerificationDto): Promise<ControllerSuccessPayload<null>> {
    const genericMessage =
      'If an account exists for this email, a verification link has been sent.';

    const user = await this.userRepository.findByEmail(dto.email);

    if (!user || !user.isActive || user.deletedAt !== null) {
      return {
        message: genericMessage,
        data: null,
      };
    }

    if (user.emailVerified) {
      return {
        message: 'Email is already verified.',
        data: null,
      };
    }

    await this.issueAndQueueVerificationEmail({
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
    });

    return {
      message: genericMessage,
      data: null,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<ControllerSuccessPayload<null>> {
    const message = 'If an account exists, password reset instructions have been sent.';

    const user = await this.userRepository.findByEmail(dto.email);

    if (user && user.isActive && user.deletedAt === null) {
      await this.issueAndQueuePasswordResetEmail({
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
      });
    }

    return {
      message,
      data: null,
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<ControllerSuccessPayload<null>> {
    const tokenHash = hashPasswordResetToken(dto.token);
    const record = await this.authRepository.findPasswordResetTokenByHash(tokenHash);

    if (record?.usedAt !== null) {
      throw new TokenInvalidException('Password reset token is invalid.');
    }

    if (record.expiresAt.getTime() <= Date.now()) {
      throw new TokenExpiredException('Password reset token has expired.');
    }

    const user = await this.userRepository.findById(record.userId);
    if (!user || !user.isActive || user.deletedAt !== null) {
      throw new TokenInvalidException('Password reset token is invalid.');
    }

    const passwordHash = await hash(dto.password);

    await this.authRepository.completePasswordReset({
      userId: user.id,
      passwordHash,
      resetTokenId: record.id,
    });
    await this.emailService.enqueueForUserPrimaryOrganization(user.id, {
      templateKey: 'password_changed',
      actionPath: '/login',
      entityType: 'password-reset',
      entityId: record.id,
      category: 'SECURITY',
    });

    return {
      message: 'Password has been reset successfully.',
      data: null,
    };
  }

  private async issueAndQueuePasswordResetEmail(input: {
    userId: string;
    email: string;
    firstName: string;
  }): Promise<void> {
    const rawToken = generatePasswordResetToken();
    const tokenHash = hashPasswordResetToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000);

    await this.authRepository.deletePasswordResetTokensForUser(input.userId);
    const resetToken = await this.authRepository.createPasswordResetToken({
      userId: input.userId,
      tokenHash,
      expiresAt,
    });

    const frontendUrl = this.configService.get('FRONTEND_URL', { infer: true });
    const resetUrl = new URL('/reset-password', frontendUrl);
    resetUrl.searchParams.set('token', rawToken);

    await this.emailService.enqueueForUserPrimaryOrganization(input.userId, {
      templateKey: 'forgot_password',
      actionPath: resetUrl.toString(),
      entityType: 'password-reset-token',
      entityId: resetToken.id,
      category: 'SECURITY',
    });
  }

  private async issueAndQueueVerificationEmail(input: {
    userId: string;
    email: string;
    firstName: string;
  }): Promise<void> {
    const rawToken = generateEmailVerificationToken();
    const tokenHash = hashEmailVerificationToken(rawToken);
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);

    await this.authRepository.deleteEmailVerificationTokensForUser(input.userId);
    const verificationToken = await this.authRepository.createEmailVerificationToken({
      userId: input.userId,
      tokenHash,
      expiresAt,
    });

    const frontendUrl = this.configService.get('FRONTEND_URL', { infer: true });
    const verificationUrl = new URL('/verify-email', frontendUrl);
    verificationUrl.searchParams.set('token', rawToken);

    await this.emailService.enqueueForUserPrimaryOrganization(input.userId, {
      templateKey: 'verify_email',
      actionPath: verificationUrl.toString(),
      entityType: 'email-verification-token',
      entityId: verificationToken.id,
      category: 'SECURITY',
    });
  }

  private async verifyPassword(passwordHash: string | null, password: string): Promise<boolean> {
    const hashToVerify = passwordHash ?? (await this.getDummyPasswordHash());

    try {
      return await verify(hashToVerify, password);
    } catch {
      return false;
    }
  }

  private getDummyPasswordHash(): Promise<string> {
    this.dummyPasswordHashPromise ??= hash('graphology-timing-safe-dummy-password');
    return this.dummyPasswordHashPromise;
  }
}
