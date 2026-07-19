import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { AssignmentModule } from './modules/assignment/assignment.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { BatchModule } from './modules/batch/batch.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { CertificateModule } from './modules/certificate/certificate.module';
import { CourseModule } from './modules/course/course.module';
import { EnrollmentModule } from './modules/enrollment/enrollment.module';
import { EmailModule } from './modules/email/email.module';
import { LessonModule } from './modules/lesson/lesson.module';
import { LessonProgressModule } from './modules/lesson-progress/lesson-progress.module';
import { LiveSessionModule } from './modules/live-session/live-session.module';
import { MeetingModule } from './modules/meeting/meeting.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { NotificationModule } from './modules/notification/notification.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PdfModule } from './modules/pdf/pdf.module';
import { StorageModule } from './modules/storage/storage.module';
import { SubmissionModule } from './modules/submission/submission.module';
import { AIModule } from './modules/ai/ai.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    EmailModule,
    HealthModule,
    AuthModule,
    AdminModule,
    CourseModule,
    BatchModule,
    EnrollmentModule,
    LessonModule,
    LessonProgressModule,
    MeetingModule,
    LiveSessionModule,
    AttendanceModule,
    AssignmentModule,
    SubmissionModule,
    CertificateModule,
    MessagingModule,
    NotificationModule,
    CalendarModule,
    PaymentsModule,
    PdfModule,
    StorageModule,
    AIModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware, RequestLoggingMiddleware).forRoutes('{*path}');
  }
}
