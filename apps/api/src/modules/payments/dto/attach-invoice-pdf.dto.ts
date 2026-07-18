import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class AttachInvoicePdfDto {
  @ApiProperty({ description: 'INVOICE_PDF MediaAsset id or secure URL' })
  @IsString()
  @MaxLength(2000)
  pdfUrl!: string;
}
