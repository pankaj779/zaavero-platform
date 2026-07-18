import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

export class PaymentOrganizationAccessDeniedException extends ForbiddenException {
  constructor(message = 'You do not have access to this organization.') {
    super({ message, errorCode: 'PAYMENT_ORGANIZATION_ACCESS_DENIED' });
  }
}

export class PaymentForbiddenException extends ForbiddenException {
  constructor(message = 'You are not allowed to perform this payment action.') {
    super({ message, errorCode: 'PAYMENT_FORBIDDEN' });
  }
}

export class PaymentOrderNotFoundException extends NotFoundException {
  constructor(message = 'Payment order not found.') {
    super({ message, errorCode: 'PAYMENT_ORDER_NOT_FOUND' });
  }
}

export class InvoiceNotFoundException extends NotFoundException {
  constructor(message = 'Invoice not found.') {
    super({ message, errorCode: 'INVOICE_NOT_FOUND' });
  }
}

export class PlanNotFoundException extends NotFoundException {
  constructor(message = 'Plan not found.') {
    super({ message, errorCode: 'PLAN_NOT_FOUND' });
  }
}

export class CouponNotFoundException extends NotFoundException {
  constructor(message = 'Coupon not found.') {
    super({ message, errorCode: 'COUPON_NOT_FOUND' });
  }
}

export class PaymentNotFoundException extends NotFoundException {
  constructor(message = 'Payment not found.') {
    super({ message, errorCode: 'PAYMENT_NOT_FOUND' });
  }
}

export class CourseNotPurchasableException extends BadRequestException {
  constructor(message = 'This course is not available for purchase.') {
    super({ message, errorCode: 'COURSE_NOT_PURCHASABLE' });
  }
}

export class BatchNotAvailableException extends BadRequestException {
  constructor(message = 'The selected batch is not open for enrollment.') {
    super({ message, errorCode: 'BATCH_NOT_AVAILABLE' });
  }
}

export class StudentProfileRequiredException extends BadRequestException {
  constructor(
    message = 'A student profile in this organization is required to purchase a course.',
  ) {
    super({ message, errorCode: 'STUDENT_PROFILE_REQUIRED' });
  }
}

export class AlreadyEnrolledException extends ConflictException {
  constructor(message = 'You are already enrolled in this batch.') {
    super({ message, errorCode: 'ALREADY_ENROLLED' });
  }
}

export class InvalidOrderRequestException extends BadRequestException {
  constructor(message = 'The order request is invalid.') {
    super({ message, errorCode: 'INVALID_ORDER_REQUEST' });
  }
}

export class InvalidOrderStateException extends ConflictException {
  constructor(message = 'The order is not in a state that allows this action.') {
    super({ message, errorCode: 'INVALID_ORDER_STATE' });
  }
}

export class IdempotencyKeyRequiredException extends BadRequestException {
  constructor(message = 'The Idempotency-Key header is required and must be 8-128 characters.') {
    super({ message, errorCode: 'IDEMPOTENCY_KEY_REQUIRED' });
  }
}

export class IdempotencyKeyConflictException extends ConflictException {
  constructor(message = 'This Idempotency-Key was already used for a different request.') {
    super({ message, errorCode: 'IDEMPOTENCY_KEY_CONFLICT' });
  }
}

export class InvalidPaymentSignatureException extends BadRequestException {
  constructor(message = 'The payment signature is invalid.') {
    super({ message, errorCode: 'INVALID_PAYMENT_SIGNATURE' });
  }
}

export class InvalidWebhookSignatureException extends UnauthorizedException {
  constructor(message = 'The webhook signature is missing or invalid.') {
    super({ message, errorCode: 'INVALID_WEBHOOK_SIGNATURE' });
  }
}

export class PaymentVerificationMismatchException extends BadRequestException {
  constructor(
    message = 'The provider payment does not match the order amount, currency, or state.',
  ) {
    super({ message, errorCode: 'PAYMENT_VERIFICATION_MISMATCH' });
  }
}

export class PaymentProviderUnavailableException extends ServiceUnavailableException {
  constructor(message = 'The payment provider is not configured. Contact the administrator.') {
    super({ message, errorCode: 'PAYMENT_PROVIDER_UNAVAILABLE' });
  }
}

export class CouponInvalidException extends BadRequestException {
  constructor(message = 'This coupon cannot be applied to the order.') {
    super({ message, errorCode: 'COUPON_INVALID' });
  }
}

export class CouponConflictException extends ConflictException {
  constructor(message = 'A coupon with this code already exists.') {
    super({ message, errorCode: 'COUPON_CONFLICT' });
  }
}

export class PlanConflictException extends ConflictException {
  constructor(message = 'A plan with this tier and interval already exists.') {
    super({ message, errorCode: 'PLAN_CONFLICT' });
  }
}

export class InvalidRefundAmountException extends BadRequestException {
  constructor(message = 'The refund amount exceeds the refundable balance.') {
    super({ message, errorCode: 'INVALID_REFUND_AMOUNT' });
  }
}

export class BillingAddressNotFoundException extends NotFoundException {
  constructor(message = 'Billing address not found or not owned by you.') {
    super({ message, errorCode: 'BILLING_ADDRESS_NOT_FOUND' });
  }
}
