import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  createArchivedReport,
  fetchArchivedReports,
  markReportSaved,
  markReportsCleaned,
  registerReportDriveLink,
  subscribeToArchivedReports,
} from '../../services/archivedReportsService';
import { buildArchivedActivitiesCsv, buildArchivedReportFileName, downloadCsvFile, getArchiveVolumeStatus } from '../../utils/archivedReportUtils';
import ConfirmModal from '../common/ConfirmModal';
import ArchivedActivitiesFilters, { emptyArchivedFilters } from './ArchivedActivitiesFilters';
import ArchivedActivitiesTable from './ArchivedActivitiesTable';
import ArchivedReportWidget from './ArchivedReportWidget';
import RegisterDriveLinkModal from './RegisterDriveLinkModal';
import ReportDetailsModal from './ReportDetailsModal';
import ReportsHistoryTable from './ReportsHistoryTable';

function ArchivedActivitiesPanel({ tasks, onRestoreTask, onCleanupTasks }) {
  const { currentUser } = useAuth();
  const [filters, setFilters] = useState(emptyArchivedFilters);
  const [restoringTask, setRestoringTask] = useState(null);

  const [reports, setReports] = useState([]);
  const [reportsError, setReportsError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [generating, setGenerating] = useState(false);
  const [registeringReport, setRegisteringReport] = useState(null);
  const [viewingReport, setViewingReport] = useState(null);
  const [cleanupOpen, setCleanupOpen] = useState(false);

  const loadReports = async () => {
    try {
      const remoteReports = await fetchArchivedReports();
      setReports(remoteReports);
      setReportsError('');
    } catch (err) {
      setReportsError(err.message ?? 'Nao foi possivel carregar os relatorios.');
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    const channel = subscribeToArchivedReports(loadReports);
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const responsibleOptions = useMemo(
    () => Array.from(new Set(tasks.map((task) => task.assignee).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [tasks],
  );

  const filteredTasks = useMemo(() => {
    const normalizedQuery = filters.query.trim().toLowerCase();

    return tasks.filter((task) => {
      const sectorMatches = filters.sector === 'all' || task.sectorId === filters.sector;
      const responsibleMatches = filters.responsible === 'all' || task.assignee === filters.responsible;
      const statusMatches = filters.status === 'all' || task.status === filters.status;
      const priorityMatches = filters.priority === 'all' || task.priority === filters.priority;

      const archivedDate = task.archivedAt ? task.archivedAt.slice(0, 10) : '';
      const fromMatches = !filters.from || (archivedDate && archivedDate >= filters.from);
      const toMatches = !filters.to || (archivedDate && archivedDate <= filters.to);

      const queryMatches =
        !normalizedQuery ||
        [task.title, task.assignee, task.sectorName, task.requesterName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);

      return sectorMatches && responsibleMatches && statusMatches && priorityMatches && fromMatches && toMatches && queryMatches;
    });
  }, [tasks, filters]);

  const volumeStatus = useMemo(() => getArchiveVolumeStatus(tasks), [tasks]);
  const pendingReport = useMemo(() => reports.find((report) => report.status === 'Pendente de Drive'), [reports]);
  const hasSavedReports = useMemo(() => reports.some((report) => report.status === 'Salvo no Drive'), [reports]);

  const handleConfirmRestore = () => {
    if (restoringTask) onRestoreTask(restoringTask.id);
    setRestoringTask(null);
  };

  const handleGenerateReport = async () => {
    if (tasks.length === 0 || generating) return;
    setGenerating(true);
    setFeedback('');

    try {
      const csv = buildArchivedActivitiesCsv(tasks);
      downloadCsvFile(csv, buildArchivedReportFileName());

      const archivedDates = tasks.map((task) => task.archivedAt).filter(Boolean).sort();
      const periodStart = archivedDates[0]?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
      const periodEnd = archivedDates[archivedDates.length - 1]?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
      const todayLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date());

      const created = await createArchivedReport(
        {
          name: `Relatório de atividades arquivadas - ${todayLabel}`,
          periodStart,
          periodEnd,
          totalExported: tasks.length,
          exportedTaskIds: tasks.map((task) => task.id),
        },
        currentUser,
      );

      setReports((current) => [created, ...current]);
      setFeedback('Relatório gerado. Salve o arquivo no Drive da empresa e registre o link abaixo antes de limpar os dados exportados.');
    } catch (err) {
      setReportsError(err.message ?? 'Nao foi possivel gerar o relatorio.');
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenRegisterDriveLink = () => {
    if (pendingReport) setRegisteringReport(pendingReport);
  };

  const handleSubmitDriveLink = async (reportId, values) => {
    try {
      const updated = await registerReportDriveLink(reportId, values);
      setReports((current) => current.map((report) => (report.id === updated.id ? updated : report)));
      setRegisteringReport(null);
      setFeedback('Link do Drive registrado com sucesso.');
    } catch (err) {
      setReportsError(err.message ?? 'Nao foi possivel registrar o link do Drive.');
    }
  };

  const handleMarkSaved = async (reportId) => {
    try {
      const updated = await markReportSaved(reportId);
      setReports((current) => current.map((report) => (report.id === updated.id ? updated : report)));
    } catch (err) {
      setReportsError(err.message ?? 'Nao foi possivel atualizar o relatorio.');
    }
  };

  const handleConfirmCleanup = async () => {
    setCleanupOpen(false);
    const savedReports = reports.filter((report) => report.status === 'Salvo no Drive');
    if (savedReports.length === 0) return;

    const taskIds = Array.from(new Set(savedReports.flatMap((report) => report.exportedTaskIds)));

    try {
      await onCleanupTasks(taskIds);
      const cleaned = await markReportsCleaned(savedReports.map((report) => report.id));
      setReports((current) => current.map((report) => cleaned.find((item) => item.id === report.id) ?? report));
      setFeedback('Atividades exportadas removidas. O histórico permanece preservado nos relatórios salvos no Drive.');
    } catch (err) {
      setReportsError(err.message ?? 'Nao foi possivel concluir a limpeza.');
    }
  };

  return (
    <div className="page-stack">
      <ArchivedReportWidget
        volumeStatus={volumeStatus}
        hasPendingReport={Boolean(pendingReport)}
        hasSavedReports={hasSavedReports}
        generating={generating}
        onGenerateReport={handleGenerateReport}
        onRegisterDriveLink={handleOpenRegisterDriveLink}
        onCleanup={() => setCleanupOpen(true)}
      />

      {feedback ? <div className="members-feedback">{feedback}</div> : null}
      {reportsError ? <div className="members-feedback error">{reportsError}</div> : null}

      <ArchivedActivitiesFilters filters={filters} onChange={setFilters} responsibleOptions={responsibleOptions} />

      <ArchivedActivitiesTable tasks={filteredTasks} onRestore={setRestoringTask} />

      <section className="page-heading">
        <div>
          <p className="eyebrow">Controle de exportações</p>
          <h2>Histórico de relatórios gerados</h2>
        </div>
      </section>

      <ReportsHistoryTable
        reports={reports}
        onEditLink={setRegisteringReport}
        onMarkSaved={handleMarkSaved}
        onViewDetails={setViewingReport}
      />

      <ConfirmModal
        open={Boolean(restoringTask)}
        title="Restaurar atividade"
        message="Deseja restaurar esta atividade para o Kanban?"
        cancelLabel="Cancelar"
        confirmLabel="Sim, restaurar"
        onCancel={() => setRestoringTask(null)}
        onConfirm={handleConfirmRestore}
      />

      <ConfirmModal
        open={cleanupOpen}
        title="Limpar atividades exportadas"
        message="Tem certeza que deseja limpar as atividades arquivadas já exportadas? Essa ação removerá esses registros da área de arquivados, mas o histórico ficará preservado no relatório salvo no Drive."
        cancelLabel="Cancelar"
        confirmLabel="Confirmar limpeza"
        onCancel={() => setCleanupOpen(false)}
        onConfirm={handleConfirmCleanup}
      />

      <RegisterDriveLinkModal
        report={registeringReport}
        onClose={() => setRegisteringReport(null)}
        onSubmit={handleSubmitDriveLink}
      />

      <ReportDetailsModal report={viewingReport} onClose={() => setViewingReport(null)} />
    </div>
  );
}

export default ArchivedActivitiesPanel;
