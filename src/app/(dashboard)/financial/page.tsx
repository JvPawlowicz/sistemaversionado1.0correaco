import { permanentRedirect } from 'next/navigation';

export default function FinancialRedirectPage() {
  permanentRedirect('/analysis');
}
