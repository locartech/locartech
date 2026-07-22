import { AlertTriangle, FileDown } from 'lucide-react';
import { formatDatePtBr } from '../../utils/dateUtils';

function ArchivedReportWidget({ volumeStatus, generating, onGenerateReport }) {
  const { level, message, total, oldestDate } = volumeStatus;
  return (
    <section className={`archived-report-widget${level !== 'none' ? ` archived-report-widget-${level}` : ''}`}>
      <div className="archived-report-widget-header">
        <div>
          <p className="eyebrow">Relatorio de arquivadas</p>
          <h3>Historico de atividades</h3>
        </div>
        <div className="archived-report-stats">
          <div className="archived-report-stat"><span>Status do volume</span><strong>{level === 'strong' ? 'Critico' : level === 'light' ? 'Atencao' : 'Normal'}</strong></div>
          <div className="archived-report-stat"><span>Arquivadas</span><strong>{total}</strong></div>
          <div className="archived-report-stat"><span>Mais antiga</span><strong>{formatDatePtBr(oldestDate, '-')}</strong></div>
        </div>
      </div>
      {level !== 'none' ? <div className={`archived-report-alert archived-report-alert-${level}`}><AlertTriangle size={16} /><span>{message}</span></div> : null}
      <div className="archived-report-actions">
        <button type="button" className="primary-button" onClick={onGenerateReport} disabled={generating || total === 0}>
          <FileDown size={16} />
          {generating ? 'Gerando...' : 'Gerar relatorio'}
        </button>
      </div>
    </section>
  );
}

export default ArchivedReportWidget;
