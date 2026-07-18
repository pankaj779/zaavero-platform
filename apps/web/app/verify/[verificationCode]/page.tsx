import type { Metadata } from 'next';
import { CertificateVerificationView } from '../../../components/public/certificate-verification-view';

export const metadata: Metadata = {
  title: 'Verify certificate',
  description: 'Verify the authenticity and status of a certificate.',
};

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ verificationCode: string }>;
}): Promise<React.JSX.Element> {
  const { verificationCode } = await params;
  return <CertificateVerificationView verificationCode={verificationCode} />;
}
