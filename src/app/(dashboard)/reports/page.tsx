import { permanentRedirect } from 'next/navigation';

export default function ReportsRedirectPage() {
  permanentRedirect('/analysis');
}
