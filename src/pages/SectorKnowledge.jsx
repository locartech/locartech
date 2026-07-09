import { ArrowLeft, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import KnowledgeCard from '../components/knowledge/KnowledgeCard';
import KnowledgeDetailsModal from '../components/knowledge/KnowledgeDetailsModal';
import KnowledgeEmptyState from '../components/knowledge/KnowledgeEmptyState';
import KnowledgeFilters from '../components/knowledge/KnowledgeFilters';
import KnowledgeFormModal from '../components/knowledge/KnowledgeFormModal';
import KnowledgeStats from '../components/knowledge/KnowledgeStats';
import { sectors } from '../data/mockData';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  createRemoteKnowledgeRecord,
  deleteRemoteKnowledgeRecord,
  fetchKnowledgeRecords,
  subscribeToKnowledge,
  updateRemoteKnowledgeRecord,
} from '../services/knowledgeService';
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
  const [usingSupabase, setUsingSupabase] = useState(false);
  const [filters, setFilters] = useState({ query: '', type: 'Todos' });
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [detailRecord, setDetailRecord] = useState(null);

  const loadRemoteRecords = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const remoteRecords = await fetchKnowledgeRecords();
      setRecords(remoteRecords);
      setUsingSupabase(true);
    } catch {
      setUsingSupabase(false);
    }
  };

  useEffect(() => {
    loadRemoteRecords();
  }, []);

  useEffect(() => {
    if (!usingSupabase) {
      saveKnowledgeRecords(records);
      return undefined;
    }

    const channel = subscribeToKnowledge(loadRemoteRecords);
    return () => {
      supabase.removeChannel(channel);
    };
  }, [records, usingSupabase]);

  const filteredRecords = useMemo(
    () => filterKnowledgeRecords(records, sector.name, filters),
    [records, sector.name, filters],
  );

  const stats = useMemo(() => getKnowledgeStats(records, sector.name), [records, sector.name]);

  const persistRecords = (nextRecords) => {
    setRecords(nextRecords);
    saveKnowledgeRecords(nextRecords);
  };

  const handleSubmit = async (values) => {
    if (usingSupabase) {
      const saved = editingRecord
        ? await updateRemoteKnowledgeRecord(editingRecord.id, sector.name, values)
        : await createRemoteKnowledgeRecord(sector.name, values);

      setRecords((current) =>
        editingRecord
          ? current.map((record) => (record.id === saved.id ? saved : record))
          : [saved, ...current],
      );
    } else {
      const nextRecords = editingRecord
        ? updateKnowledgeRecord(records, editingRecord.id, values)
        : [createKnowledgeRecord(sector.name, values), ...records];
      persistRecords(nextRecords);
    }

    setFormOpen(false);
    setEditingRecord(null);
  };

  const handleDelete = async (record) => {
    const shouldDelete = window.confirm('Deseja excluir este registro da base de conhecimento?');
    if (!shouldDelete) return;

    if (usingSupabase) {
      await deleteRemoteKnowledgeRecord(record.id);
      setRecords((current) => current.filter((item) => item.id !== record.id));
      return;
    }

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
          <p className="eyebrow">Documentos</p>
          <h2>Documentos - {sector.name}</h2>
          <p>
            Organize manuais do setor, POPs, documentos e outros arquivos internos em um unico lugar.
          </p>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setEditingRecord(null);
            setFormOpen(true);
          }}
        >
          <Plus size={17} aria-hidden="true" />
          Novo documento
        </button>
      </section>

      {!usingSupabase ? (
        <div className="members-feedback">Usando documentos locais ate a conexao Supabase estar disponivel.</div>
      ) : null}

      <KnowledgeStats stats={stats} />

      <section className="panel knowledge-toolbar">
        <KnowledgeFilters filters={filters} onChange={setFilters} />
      </section>

      <section className="knowledge-grid" aria-label={`Documentos do setor ${sector.name}`}>
        {filteredRecords.length > 0 ? (
          filteredRecords.map((record) => (
            <KnowledgeCard
              key={record.id}
              record={record}
              onView={setDetailRecord}
              onEdit={(item) => {
                setEditingRecord(item);
                setFormOpen(true);
              }}
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
            setEditingRecord(record);
            setFormOpen(true);
          }}
        />
      ) : null}
    </div>
  );
}

export default SectorKnowledge;
