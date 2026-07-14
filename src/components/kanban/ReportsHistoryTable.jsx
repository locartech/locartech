import { CheckCircle2, Eye, ExternalLink, Pencil } from 'lucide-react';
import EmptyState from '../common/EmptyState';

const formatDate = (value) =>
  value ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${value}T12:00:00`)) : '-';

const statusClassMap = {
  'Pendente de Drive': 'report-status-pending',
  'Salvo no Drive': 'report-status-saved',
  'Limpeza realizada': 'report-status-cleaned',
};

function ReportsHistoryTable({ reports, onEditLink, onMarkSaved, onViewDetails }) {
  if (reports.length === 0) {
    return (
      <EmptyState
        title="Nenhum relatório gerado"
        description="Gere um relatório das atividades arquivadas para começar o histórico."
      />
    );
  }

  return (
    <div className="request-table-shell archived-table-shell">
      <div className="request-table archived-table reports-table">
        <div className="request-row archived-row reports-row archived-table-head" role="row">
          <div>Relatório</div>
          <div>Período</div>
          <div>Qtd. exportada</div>
          <div>Responsável</div>
          <div>Geração</div>
          <div>Status</div>
          <div>Ações</div>
        </div>

        {reports.map((report) => (
          <div className="request-row archived-row reports-row" key={report.id}>
            <div>
              <strong>{report.name}</strong>
            </div>
            <div className="muted-cell">
              {formatDate(report.periodStart)} — {formatDate(report.periodEnd)}
            </div>
            <div>{report.totalExported}</div>
            <div>{report.generatedByName}</div>
            <div>{formatDate(report.generatedAt?.slice(0, 10))}</div>
            <div>
              <span className={`report-status-pill ${statusClassMap[report.status] ?? ''}`}>{report.status}</span>
            </div>
            <div className="request-actions">
              {report.driveLink ? (
                <a
                  className="table-icon-button"
                  href={report.driveLink}
                  target="_blank"
                  rel="noreferrer"
                  title="Abrir link do Drive"
                >
                  <ExternalLink size={16} aria-hidden="true" />
                </a>
              ) : null}
              {report.status !== 'Limpeza realizada' ? (
                <button type="button" className="table-icon-button" onClick={() => onEditLink(report)} title="Editar link">
                  <Pencil size={16} aria-hidden="true" />
                </button>
              ) : null}
              {report.status === 'Pendente de Drive' && report.driveLink ? (
                <button
                  type="button"
                  className="table-icon-button success"
                  onClick={() => onMarkSaved(report.id)}
                  title="Marcar como salvo"
                >
                  <CheckCircle2 size={16} aria-hidden="true" />
                </button>
              ) : null}
              <button type="button" className="table-icon-button" onClick={() => onViewDetails(report)} title="Ver detalhes">
                <Eye size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ReportsHistoryTable;
