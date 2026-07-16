import { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getArchiveVolumeStatus } from '../../utils/archivedReportUtils';
import { downloadExcelReport } from '../../utils/excelReportUtils';
import {
  archivedDateAccessor,
  buildKanbanReportRows,
  kanbanReportColumns,
  makeReportFileName,
} from '../../utils/reportDataUtils';
import ConfirmModal from '../common/ConfirmModal';
import ReportGenerationModal from '../common/ReportGenerationModal';
import ArchivedActivitiesFilters, { emptyArchivedFilters } from './ArchivedActivitiesFilters';
import ArchivedActivitiesTable from './ArchivedActivitiesTable';
import ArchivedReportWidget from './ArchivedReportWidget';

function ArchivedActivitiesPanel({ tasks, onRestoreTask, onCleanupTasks, canManageTask, onBlockedAction }) {
  const { currentUser, isAdmin } = useAuth();
  const [filters, setFilters] = useState(emptyArchivedFilters);
  const [restoringTask, setRestoringTask] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [cleanupIds, setCleanupIds] = useState([]);
  const [cleanupStep, setCleanupStep] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [reportError, setReportError] = useState('');

  const responsibleOptions = useMemo(
    () => Array.from(new Set(tasks.map((task) => task.assignee).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [tasks],
  );

  const filteredTasks = useMemo(() => {
    const normalizedQuery = filters.query.trim().toLowerCase();
    return tasks.filter((task) => {
      const archivedDate = task.archivedAt ? task.archivedAt.slice(0, 10) : '';
      return (
        (filters.sector === 'all' || task.sectorId === filters.sector) &&
        (filters.responsible === 'all' || task.assignee === filters.responsible) &&
        (filters.status === 'all' || task.status === filters.status) &&
        (filters.priority === 'all' || task.priority === filters.priority) &&
        (!filters.from || (archivedDate && archivedDate >= filters.from)) &&
        (!filters.to || (archivedDate && archivedDate <= filters.to)) &&
        (!normalizedQuery || [task.title, task.assignee, task.sectorName, task.requesterName]
          .filter(Boolean).join(' ').toLowerCase().includes(normalizedQuery))
      );
    });
  }, [tasks, filters]);

  const reportableTasks = useMemo(
    () => filteredTasks.filter((task) => isAdmin || canManageTask(task.sectorId)),
    [filteredTasks, isAdmin, canManageTask],
  );
  const volumeStatus = useMemo(() => getArchiveVolumeStatus(reportableTasks), [reportableTasks]);

  const handleGenerateReport = async (draft, selectedTasks) => {
    if (generating) return;
    setGenerating(true);
    setReportError('');
    try {
      await downloadExcelReport({
        fileName: makeReportFileName(draft.name),
        sheetName: 'Atividades arquivadas',
        tableName: 'AtividadesArquivadas',
        title: draft.name,
        columns: kanbanReportColumns,
        rows: buildKanbanReportRows(selectedTasks),
      });
      setReportOpen(false);
      setFeedback(`Relatorio gerado com ${selectedTasks.length} atividade(s).`);
      if (isAdmin) {
        setCleanupIds(selectedTasks.map((task) => task.id));
        setCleanupStep(1);
      }
    } catch (err) {
      setReportError(err.message ?? 'Nao foi possivel gerar o relatorio.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCleanup = async () => {
    try {
      await onCleanupTasks(cleanupIds);
      setFeedback(`${cleanupIds.length} registro(s) arquivado(s) excluido(s) do site.`);
      setCleanupIds([]);
      setCleanupStep(0);
    } catch (err) {
      setReportError(err.message ?? 'Nao foi possivel excluir o historico.');
      setCleanupStep(0);
    }
  };

  return (
    <div className="page-stack">
      <ArchivedReportWidget
        volumeStatus={volumeStatus}
        generating={generating}
        onGenerateReport={() => setReportOpen(true)}
      />

      {feedback ? <div className="members-feedback">{feedback}</div> : null}
      {reportError ? <div className="members-feedback error">{reportError}</div> : null}

      <ArchivedActivitiesFilters filters={filters} onChange={setFilters} responsibleOptions={responsibleOptions} />
      <ArchivedActivitiesTable
        tasks={filteredTasks}
        onRestore={setRestoringTask}
        canManageTask={canManageTask}
        onBlockedAction={onBlockedAction}
      />

      <ConfirmModal
        open={Boolean(restoringTask)}
        title="Restaurar atividade"
        message="Deseja restaurar esta atividade para o Kanban?"
        cancelLabel="Cancelar"
        confirmLabel="Sim, restaurar"
        tone="primary"
        onCancel={() => setRestoringTask(null)}
        onConfirm={() => {
          if (restoringTask) onRestoreTask(restoringTask.id);
          setRestoringTask(null);
        }}
      />

      <ReportGenerationModal
        open={reportOpen}
        title="Gerar relatorio de atividades arquivadas"
        defaultName="Relatorio de atividades arquivadas"
        items={reportableTasks}
        dateAccessor={archivedDateAccessor}
        entityLabel="atividade(s) arquivada(s)"
        onClose={() => setReportOpen(false)}
        onGenerate={handleGenerateReport}
      />

      <ConfirmModal
        open={cleanupStep === 1}
        title="Excluir dados do relatorio"
        message={`Deseja excluir do site os ${cleanupIds.length} registro(s) incluidos no relatorio que acabou de ser gerado?`}
        cancelLabel="Nao"
        confirmLabel="Sim"
        onCancel={() => setCleanupStep(0)}
        onConfirm={() => setCleanupStep(2)}
      />
      <ConfirmModal
        open={cleanupStep === 2}
        title="Confirmar exclusao permanente"
        message="Tem certeza que deseja excluir este historico do site? Esta acao nao pode ser desfeita."
        cancelLabel="Cancelar"
        confirmLabel="Sim, excluir historico"
        onCancel={() => setCleanupStep(0)}
        onConfirm={handleCleanup}
      />
    </div>
  );
}

export default ArchivedActivitiesPanel;
