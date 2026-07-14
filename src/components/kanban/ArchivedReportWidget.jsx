import { AlertTriangle, FileDown, Trash2 } from 'lucide-react';

const formatDate = (value) =>
  value ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(value) : '-';

function ArchivedReportWidget({
  volumeStatus,
  hasPendingReport,
  hasSavedReports,
  generating,
  onGenerateReport,
  onCleanup,
}) {
  const { level, message, total, oldestDate } = volumeStatus;

  return (
    <section className={`archived-report-widget${level !== 'none' ? ` archived-report-widget-${level}` : ''}`}>
      <div className="archived-report-widget-header">
        <div>
          <p className="eyebrow">Relatório de arquivadas</p>
          <h3>Controle e limpeza</h3>
        </div>
        <div className="archived-report-stats">
          <div className="archived-report-stat">
            <span>Status do volume</span>
            <strong>{level === 'strong' ? 'Crítico' : level === 'light' ? 'Atenção' : 'Normal'}</strong>
          </div>
          <div className="archived-report-stat">
            <span>Arquivadas</span>
            <strong>{total}</strong>
          </div>
          <div className="archived-report-stat">
            <span>Mais antiga</span>
            <strong>{formatDate(oldestDate)}</strong>
          </div>
        </div>
      </div>

      {level !== 'none' ? (
        <div className={`archived-report-alert archived-report-alert-${level}`}>
          <AlertTriangle size={16} aria-hidden="true" />
          <span>{message}</span>
        </div>
      ) : null}

      <div className="archived-report-actions">
        <button
          type="button"
          className="primary-button"
          onClick={onGenerateReport}
          disabled={generating || (total === 0 && !hasPendingReport)}
        >
          <FileDown size={16} aria-hidden="true" />
          {generating ? 'Gerando...' : 'Gerar relatório'}
        </button>
        {hasSavedReports ? (
          <button type="button" className="ghost-button archived-cleanup-button" onClick={onCleanup}>
            <Trash2 size={16} aria-hidden="true" />
            Limpar atividades exportadas
          </button>
        ) : null}
      </div>
    </section>
  );
}

export default ArchivedReportWidget;
