import { KNOWLEDGE_STORAGE_KEY, initialKnowledgeRecords } from '../data/knowledgeData';

const today = '2026-07-07';

export function loadKnowledgeRecords() {
  try {
    const savedRecords = localStorage.getItem(KNOWLEDGE_STORAGE_KEY);
    if (savedRecords) {
      return JSON.parse(savedRecords);
    }
  } catch {
    localStorage.removeItem(KNOWLEDGE_STORAGE_KEY);
  }

  return initialKnowledgeRecords;
}

export function saveKnowledgeRecords(records) {
  localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify(records));
}

export function createKnowledgeRecord(sector, values) {
  return {
    id: `kb-${crypto.randomUUID()}`,
    sector,
    title: values.title.trim(),
    description: values.description.trim(),
    type: values.type,
    responsible: values.responsible.trim(),
    publishedAt: values.publishedAt,
    driveLink: values.driveLink.trim(),
    createdAt: today,
    updatedAt: null,
  };
}

export function updateKnowledgeRecord(records, recordId, values) {
  return records.map((record) =>
    record.id === recordId
      ? {
          ...record,
          title: values.title.trim(),
          description: values.description.trim(),
          type: values.type,
          responsible: values.responsible.trim(),
          publishedAt: values.publishedAt,
          driveLink: values.driveLink.trim(),
          updatedAt: today,
        }
      : record,
  );
}

export function deleteKnowledgeRecord(records, recordId) {
  return records.filter((record) => record.id !== recordId);
}

export function filterKnowledgeRecords(records, sector, filters) {
  const normalizedQuery = filters.query.trim().toLowerCase();

  return records.filter((record) => {
    const sectorMatches = record.sector === sector;
    const typeMatches = filters.type === 'Todos' || record.type === filters.type;
    const queryMatches =
      !normalizedQuery ||
      `${record.title} ${record.description} ${record.type} ${record.responsible}`
        .toLowerCase()
        .includes(normalizedQuery);

    return sectorMatches && typeMatches && queryMatches;
  });
}

export function getKnowledgeStats(records, sector) {
  const sectorRecords = records.filter((record) => record.sector === sector);
  return {
    total: sectorRecords.length,
    documents: sectorRecords.filter((record) => record.type === 'Documento').length,
    manuals: sectorRecords.filter((record) => record.type === 'Manual').length,
    trainings: sectorRecords.filter((record) => record.type === 'Treinamento').length,
    responsibles: new Set(sectorRecords.map((record) => record.responsible)).size,
  };
}

export function validateKnowledgeRecord(values) {
  if (!values.title.trim()) return 'Informe o nome do arquivo ou material.';
  if (!values.description.trim()) return 'Informe uma descrição.';
  if (!values.responsible.trim()) return 'Informe o responsável.';
  if (!values.publishedAt) return 'Informe a data de publicação.';
  if (!values.driveLink.trim()) return 'Informe o link do Drive.';
  if (!/^https?:\/\//i.test(values.driveLink.trim())) {
    return 'O link deve começar com http:// ou https://.';
  }
  return '';
}
