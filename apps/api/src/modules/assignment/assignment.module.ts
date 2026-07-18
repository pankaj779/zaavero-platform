import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ASSIGNMENT_REPOSITORY } from './constants/injection-tokens';
import { AssignmentController } from './controllers/assignment.controller';
import { PrismaAssignmentRepository } from './repositories/prisma-assignment.repository';
import { AssignmentService } from './services/assignment.service';

@Module({
  imports: [AuthModule],
  controllers: [AssignmentController],
  providers: [
    AssignmentService,
    {
      provide: ASSIGNMENT_REPOSITORY,
      useClass: PrismaAssignmentRepository,
    },
  ],
  exports: [AssignmentService, ASSIGNMENT_REPOSITORY],
})
export class AssignmentModule {}
