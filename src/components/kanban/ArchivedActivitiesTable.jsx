import { RotateCcw } from 'lucide-react';
import EmptyState from '../common/EmptyState';
import RequestPriorityBadge from '../requests/RequestPriorityBadge';
import StatusBadge from './StatusBadge';

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
        new Date(`${value}T12:00:00`),
      )
    : 'Sem data';

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

function ArchivedActivitiesTable({ tasks, onRestore }) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        title="Nenhuma atividade arquivada"
        description="Ajuste os filtros ou arquive uma atividade no Kanban para vê-la aqui."
      />
    );
  }

  return (
    <div className="request-table-shell archived-table-shell">
      <div className="request-table archived-table">
        <div className="request-row archived-row archived-table-head" role="row">
          <div>Atividade</div>
          <div>Setor</div>
          <div>Responsável</div>
          <div>Status final</div>
          <div>Prioridade</div>
          <div>Prazo</div>
          <div>Origem</div>
          <div>Arquivamento</div>
          <div>Ações</div>
        </div>

        {tasks.map((task) => (
          <div className="request-row archived-row" key={task.id}>
            <div className="request-title-cell">
              <strong>{task.title}</strong>
              <span>{task.description || 'Sem descrição'}</span>
            </div>
            <div>{task.sectorName}</div>
            <div>{task.assignee || 'Sem responsável'}</div>
            <div>
              <StatusBadge value={task.status} disabled />
            </div>
            <div>
              <RequestPriorityBadge value={task.priority ?? 'medium'} />
            </div>
            <div>{formatDate(task.date)}</div>
            <div>
              {task.sourceRequestId ? (
                <>
                  <span className="stage-source-chip">Solicitação</span>
                  {task.requesterName || task.requesterSector ? (
                    <span className="muted-cell">
                      {task.requesterName}
                      {task.requesterName && task.requesterSector ? ' · ' : ''}
                      {task.requesterSector}
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="muted-cell">Manual</span>
              )}
            </div>
            <div>
              <strong>{task.archivedByName || 'Desconhecido'}</strong>
              <span className="muted-cell">{formatDateTime(task.archivedAt)}</span>
            </div>
            <div className="request-actions">
              <button
                type="button"
                className="table-icon-button success"
                onClick={() => onRestore(task)}
                title="Restaurar atividade"
              >
                <RotateCcw size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ArchivedActivitiesTable;
