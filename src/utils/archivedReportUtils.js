import { kanbanStatuses } from '../data/kanbanData';
import { requestPriorities } from '../data/requestsData';

const CSV_HEADERS = [
  'ID da atividade',
  'Nome da atividade',
  'Descrição',
  'Setor',
  'Responsável',
  'Status final',
  'Prioridade',
  'Data/prazo da atividade',
  'Origem',
  'Solicitante',
  'Setor solicitante',
  'Arquivado por',
  'Data e hora do arquivamento',
];

function statusLabel(status) {
  return kanbanStatuses.find((item) => item.id === status)?.label ?? status ?? '';
}

function priorityLabel(priority) {
  return requestPriorities.find((item) => item.id === priority)?.label ?? priority ?? '';
}

function escapeCsvValue(value) {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n;]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

// pt-BR Excel opens CSVs with ";" as the field separator (its decimal separator is ","),
// so a comma-separated file renders as a single jumbled column.
export function buildArchivedActivitiesCsv(tasks) {
  const rows = tasks.map((task) => [
    task.id,
    task.title,
    task.description || '',
    task.sectorName || '',
    task.assignee || '',
    statusLabel(task.status),
    priorityLabel(task.priority),
    task.date || '',
    task.sourceRequestId ? 'Solicitação' : 'Manual',
    task.requesterName || '',
    task.requesterSector || '',
    task.archivedByName || '',
    task.archivedAt ? new Date(task.archivedAt).toISOString() : '',
  ]);

  const lines = [CSV_HEADERS, ...rows].map((row) => row.map(escapeCsvValue).join(';'));
  return lines.join('\r\n');
}

export function downloadCsvFile(csvContent, fileName) {
  const blob = new Blob([`﻿${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function buildArchivedReportFileName(date = new Date()) {
  const isoDate = date.toISOString().slice(0, 10);
  return `relatorio-atividades-arquivadas-${isoDate}.csv`;
}

const LIGHT_WARNING_MESSAGE =
  'Há um volume considerável de atividades arquivadas. Considere gerar um relatório para manter o sistema organizado.';
const STRONG_WARNING_MESSAGE =
  'Recomendamos gerar um relatório das atividades arquivadas e limpar os registros já exportados.';

export function getArchiveVolumeStatus(tasks) {
  const total = tasks.length;

  const oldestDate = tasks.reduce((oldest, task) => {
    if (!task.archivedAt) return oldest;
    const date = new Date(task.archivedAt);
    return !oldest || date < oldest ? date : oldest;
  }, null);

  const oldestDays = oldestDate ? Math.floor((Date.now() - oldestDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  let level = 'none';
  let message = '';

  if (total >= 300 || oldestDays >= 90) {
    level = 'strong';
    message = STRONG_WARNING_MESSAGE;
  } else if (total >= 200 || oldestDays >= 60) {
    level = 'light';
    message = LIGHT_WARNING_MESSAGE;
  }

  return { level, message, total, oldestDate, oldestDays };
}
