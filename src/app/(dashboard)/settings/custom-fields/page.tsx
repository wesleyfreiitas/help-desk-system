import { getCustomFields } from '@/app/actions/customFields';
import CustomFieldsClient from './CustomFieldsClient';

export default async function CustomFieldsPage() {
  const fields = await getCustomFields();

  return <CustomFieldsClient initialFields={fields} />;
}
