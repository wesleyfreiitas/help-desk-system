import { getSlaPolicies } from '@/app/actions/sla';
import SlaConfigForm from './SlaConfigForm';

export default async function SlaSettingsPage() {
  const policies = await getSlaPolicies();

  return (
    <div className="sla-settings-container">
      <div className="settings-section-header">
        <h3 className="settings-section-title">Políticas de SLA</h3>
        <p className="settings-section-description">
          Defina as metas de tempo para resposta e resolução de chamados com base na prioridade.
        </p>
      </div>

      <SlaConfigForm initialPolicies={policies} />
    </div>
  );
}
