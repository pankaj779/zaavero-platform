import type { Metadata } from 'next';
import { LoginPageClient } from './login-page-client';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to the Graphology Platform.',
};

export default function LoginPage(): React.JSX.Element {
  return <LoginPageClient />;
}
