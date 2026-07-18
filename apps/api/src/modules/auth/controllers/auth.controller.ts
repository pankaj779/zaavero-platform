import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ControllerSuccessPayload } from '../../../common/interfaces/api-response.interface';
import { CurrentUser } from '../decorators/current-user.decorator';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { LoginDto } from '../dto/login.dto';
import { LogoutDto } from '../dto/logout.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { RegisterDto } from '../dto/register.dto';
import { ResendVerificationDto } from '../dto/resend-verification.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { UpdateAvatarDto } from '../dto/update-avatar.dto';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthService } from '../services/auth.service';
import type { AuthenticatedUser } from '../types/authenticated-user.type';
import type { LoginResponseData, RefreshResponseData } from '../types/login-response.type';
import type { RegisterResponseData } from '../types/register-response.type';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user account',
    description: 'Creates a Student in Graphology Academy and sends email verification.',
  })
  register(@Body() dto: RegisterDto): Promise<ControllerSuccessPayload<RegisterResponseData>> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate with email and password',
    description: 'Returns a JWT access token and an opaque refresh token.',
  })
  login(@Body() dto: LoginDto): Promise<ControllerSuccessPayload<LoginResponseData>> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate refresh token and issue a new access token',
    description: 'Replay of a revoked refresh token revokes the entire token family.',
  })
  refresh(@Body() dto: RefreshTokenDto): Promise<ControllerSuccessPayload<RefreshResponseData>> {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a refresh token' })
  logout(@Body() dto: LogoutDto): Promise<ControllerSuccessPayload<null>> {
    return this.authService.logout(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Current authenticated user',
    description: 'Returns roles, permissions, and organization membership for the access token.',
  })
  me(@CurrentUser() user: AuthenticatedUser): Promise<
    ControllerSuccessPayload<
      AuthenticatedUser & {
        firstName: string;
        lastName: string;
        phone: string | null;
        emailVerified: boolean;
        isActive: boolean;
      }
    >
  > {
    return this.authService.getCurrentUser(user);
  }

  @Patch('me/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Set current user avatar from a USER_AVATAR MediaAsset' })
  updateAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateAvatarDto,
  ): Promise<ControllerSuccessPayload<{ profileImage: string | null }>> {
    return this.authService.updateAvatar(user, dto);
  }

  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address using a verification token' })
  verifyEmail(@Query() dto: VerifyEmailDto): Promise<ControllerSuccessPayload<{ email: string }>> {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification link' })
  resendVerification(@Body() dto: ResendVerificationDto): Promise<ControllerSuccessPayload<null>> {
    return this.authService.resendVerification(dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request a password reset email',
    description: 'Always returns the same success message to avoid email enumeration.',
  })
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<ControllerSuccessPayload<null>> {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password using a one-time reset token',
    description: 'Invalidates reset tokens and revokes all refresh sessions for the user.',
  })
  resetPassword(@Body() dto: ResetPasswordDto): Promise<ControllerSuccessPayload<null>> {
    return this.authService.resetPassword(dto);
  }
}
