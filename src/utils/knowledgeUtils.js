export function normalizeKnowledgeType(type) {
  return {
    Documento: 'Documentos',
    Manual: 'Manual do setor',
    Treinamento: 'Outros',
    Link: 'Outros',
    Processo: 'POPs',
    Outro: 'Outros',
  }[type] ?? type;
}

export function filterKnowledgeRecords(records, sector, filters) {
  const normalizedQuery = filters.query.trim().toLowerCase();

  return records.filter((record) => {
    const recordType = normalizeKnowledgeType(record.type);
    const sectorMatches = record.sector === sector;
    const typeMatches = filters.type === 'Todos' || recordType === filters.type;
    const publishedAtMatches =
      (!filters.publishedFrom || record.publishedAt >= filters.publishedFrom) &&
      (!filters.publishedTo || record.publishedAt <= filters.publishedTo);
    const queryMatches =
      !normalizedQuery ||
      `${record.title} ${record.description} ${recordType} ${record.responsible}`
        .toLowerCase()
        .includes(normalizedQuery);

    return sectorMatches && typeMatches && publishedAtMatches && queryMatches;
  });
}

export function getKnowledgeStats(records, sector) {
  const sectorRecords = records.filter((record) => record.sector === sector);
  return {
    sectorManual: sectorRecords.filter((record) => normalizeKnowledgeType(record.type) === 'Manual do setor').length,
    pops: sectorRecords.filter((record) => normalizeKnowledgeType(record.type) === 'POPs').length,
    documents: sectorRecords.filter((record) => normalizeKnowledgeType(record.type) === 'Documentos').length,
    others: sectorRecords.filter((record) => normalizeKnowledgeType(record.type) === 'Outros').length,
  };
}

export function validateKnowledgeRecord(values) {
  if (!values.title.trim()) return 'Informe o nome do arquivo ou material.';
  if (!values.publishedAt) return 'Informe a data de publicação.';
  if (values.driveLink.trim() && !/^https?:\/\//i.test(values.driveLink.trim())) {
    return 'O link deve começar com http:// ou https://.';
  }
  return '';
}
