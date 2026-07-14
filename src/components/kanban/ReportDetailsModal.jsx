import { X } from 'lucide-react';

const formatDate = (value) =>
  value ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${value}T12:00:00`)) : '-';

const formatDateTime = (value) =>
  value
    ? new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(value))
    : '-';

function ReportDetailsModal({ report, onClose }) {
  if (!report) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="edit-modal profile-modal" role="dialog" aria-modal="true" aria-labelledby="report-details-title">
        <div className="edit-modal-header">
          <div>
            <p className="eyebrow">Relatório de arquivadas</p>
            <h2 id="report-details-title">{report.name}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} title="Fechar modal">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="profile-modal-body">
          <dl className="profile-detail-grid">
            <div>
              <dt>Período</dt>
              <dd>{formatDate(report.periodStart)} — {formatDate(report.periodEnd)}</dd>
            </div>
            <div>
              <dt>Atividades exportadas</dt>
              <dd>{report.totalExported}</dd>
            </div>
            <div>
              <dt>Responsável</dt>
              <dd>{report.generatedByName}</dd>
            </div>
            <div>
              <dt>Data de geração</dt>
              <dd>{formatDateTime(report.generatedAt)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{report.status}</dd>
            </div>
            <div>
              <dt>Limpeza realizada em</dt>
              <dd>{formatDateTime(report.cleanedAt)}</dd>
            </div>
            <div>
              <dt>Link do Drive</dt>
              <dd>
                {report.driveLink ? (
                  <a href={report.driveLink} target="_blank" rel="noreferrer">
                    Abrir link
                  </a>
                ) : (
                  'Não registrado'
                )}
              </dd>
            </div>
            <div>
              <dt>Observações</dt>
              <dd>{report.notes || 'Sem observações'}</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}

export default ReportDetailsModal;
