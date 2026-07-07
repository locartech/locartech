import { ArrowLeft, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import KnowledgeCard from '../components/knowledge/KnowledgeCard';
import KnowledgeDetailsModal from '../components/knowledge/KnowledgeDetailsModal';
import KnowledgeEmptyState from '../components/knowledge/KnowledgeEmptyState';
import KnowledgeFilters from '../components/knowledge/KnowledgeFilters';
import KnowledgeFormModal from '../components/knowledge/KnowledgeFormModal';
import KnowledgeStats from '../components/knowledge/KnowledgeStats';
import { sectors } from '../data/mockData';
import {
  createKnowledgeRecord,
  deleteKnowledgeRecord,
  filterKnowledgeRecords,
  getKnowledgeStats,
  loadKnowledgeRecords,
  saveKnowledgeRecords,
  updateKnowledgeRecord,
} from '../utils/knowledgeUtils';

function SectorKnowledge({ knowledgeSectorId, onBackToSectors }) {
  const sector = sectors.find((item) => item.id === knowledgeSectorId) ?? sectors[0];
  const [records, setRecords] = useState(loadKnowledgeRecords);
  const [filters, setFilters] = useState({ query: '', type: 'Todos' });
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [detailRecord, setDetailRecord] = useState(null);

  const filteredRecords = useMemo(
    () => filterKnowledgeRecords(records, sector.name, filters),
    [records, sector.name, filters],
  );

  const stats = useMemo(() => getKnowledgeStats(records, sector.name), [records, sector.name]);

  const persistRecords = (nextRecords) => {
    setRecords(nextRecords);
    saveKnowledgeRecords(nextRecords);
  };

  const handleCreate = () => {
    setEditingRecord(null);
    setFormOpen(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormOpen(true);
  };

  const handleSubmit = (values) => {
    const nextRecords = editingRecord
      ? updateKnowledgeRecord(records, editingRecord.id, values)
      : [createKnowledgeRecord(sector.name, values), ...records];

    persistRecords(nextRecords);
    setFormOpen(false);
    setEditingRecord(null);
  };

  const handleDelete = (record) => {
    const shouldDelete = window.confirm('Deseja excluir este registro da base de conhecimento?');
    if (!shouldDelete) return;

    persistRecords(deleteKnowledgeRecord(records, record.id));
  };

  return (
    <div className="page-stack knowledge-page">
      <section className="page-heading knowledge-page-heading">
        <div>
          <button type="button" className="inline-back-button" onClick={onBackToSectors}>
            <ArrowLeft size={16} aria-hidden="true" />
            Voltar para setores
          </button>
          <p className="eyebrow">Base de conhecimento</p>
          <h2>Base de Conhecimento - {sector.name}</h2>
          <p>
            Organize documentos, manuais, links e processos internos do setor em um unico lugar.
          </p>
        </div>
        <button type="button" className="primary-button" onClick={handleCreate}>
          <Plus size={17} aria-hidden="true" />
          Novo registro
        </button>
      </section>

      <KnowledgeStats stats={stats} />

      <section className="panel knowledge-toolbar">
        <KnowledgeFilters filters={filters} onChange={setFilters} />
      </section>

      <section className="knowledge-grid" aria-label={`Registros da base de conhecimento de ${sector.name}`}>
        {filteredRecords.length > 0 ? (
          filteredRecords.map((record) => (
            <KnowledgeCard
              key={record.id}
              record={record}
              onView={setDetailRecord}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <KnowledgeEmptyState />
        )}
      </section>

      {formOpen ? (
        <KnowledgeFormModal
          sectorName={sector.name}
          record={editingRecord}
          onClose={() => {
            setFormOpen(false);
            setEditingRecord(null);
          }}
          onSubmit={handleSubmit}
        />
      ) : null}

      {detailRecord ? (
        <KnowledgeDetailsModal
          record={detailRecord}
          onClose={() => setDetailRecord(null)}
          onEdit={(record) => {
            setDetailRecord(null);
            handleEdit(record);
          }}
        />
      ) : null}
    </div>
  );
}

export default SectorKnowledge;
