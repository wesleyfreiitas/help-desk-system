import { getCannedResponses } from '@/app/actions/canned-responses';
import CannedResponsesManager from './CannedResponsesManager';

export default async function CannedResponsesPage() {
  const responses = await getCannedResponses();

  return <CannedResponsesManager initialResponses={responses} />;
}
