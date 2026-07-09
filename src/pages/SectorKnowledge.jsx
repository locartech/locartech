import { ArrowLeft, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import KnowledgeCard from '../components/knowledge/KnowledgeCard';
import KnowledgeDetailsModal from '../components/knowledge/KnowledgeDetailsModal';
import KnowledgeEmptyState from '../components/knowledge/KnowledgeEmptyState';
import KnowledgeFilters from '../components/knowledge/KnowledgeFilters';
import KnowledgeFormModal from '../components/knowledge/KnowledgeFormModal';
import KnowledgeStats from '../components/knowledge/KnowledgeStats';
import { supabase } from '../lib/supabase';
import {
  createRemoteKnowledgeRecord,
  deleteRemoteKnowledgeRecord,
  fetchKnowledgeRecords,
  subscribeToKnowledge,
  updateRemoteKnowledgeRecord,
} from '../services/knowledgeService';
import { fetchSectors } from '../services/sectorsService';
import { filterKnowledgeRecords, getKnowledgeStats } from '../utils/knowledgeUtils';

function SectorKnowledge({ knowledgeSectorId, onBackToSectors }) {
  const [sector, setSector] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ query: '', type: 'Todos' });
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [detailRecord, setDetailRecord] = useState(null);

  const loadRecords = async () => {
    try {
      const remoteRecords = await fetchKnowledgeRecords();
      setRecords(remoteRecords);
      setError('');
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel carregar os documentos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    fetchSectors()
      .then((sectorList) => {
        if (!mounted) return;
        setSector(sectorList.find((item) => item.slug === knowledgeSectorId) ?? sectorList[0] ?? null);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [knowledgeSectorId]);

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    const channel = subscribeToKnowledge(loadRecords);
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredRecords = useMemo(
    () => (sector ? filterKnowledgeRecords(records, sector.name, filters) : []),
    [records, sector, filters],
  );

  const stats = useMemo(() => (sector ? getKnowledgeStats(records, sector.name) : null), [records, sector]);

  const handleSubmit = async (values) => {
    if (!sector) return;

    try {
      const saved = editingRecord
        ? await updateRemoteKnowledgeRecord(editingRecord.id, sector.name, values)
        : await createRemoteKnowledgeRecord(sector.name, values);

      setRecords((current) =>
        editingRecord
          ? current.map((record) => (record.id === saved.id ? saved : record))
          : [saved, ...current],
      );
      setFormOpen(false);
      setEditingRecord(null);
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel salvar o documento.');
    }
  };

  const handleDelete = async (record) => {
    const shouldDelete = window.confirm('Deseja excluir este documento?');
    if (!shouldDelete) return;

    try {
      await deleteRemoteKnowledgeRecord(record.id);
      setRecords((current) => current.filter((item) => item.id !== record.id));
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel excluir o documento.');
    }
  };

  if (!sector) {
    return (
      <div className="page-stack knowledge-page">
        {loading ? <div className="members-feedback">Carregando...</div> : null}
        {error ? <div className="members-feedback error">{error}</div> : null}
      </div>
    );
  }

  return (
    <div className="page-stack knowledge-page">
      <section className="page-heading knowledge-page-heading">
        <div>
          <button type="button" className="inline-back-button" onClick={onBackToSectors}>
            <ArrowLeft size={16} aria-hidden="true" />
            Voltar para setores
          </button>
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

      {error ? <div className="members-feedback error">{error}</div> : null}

      {stats ? <KnowledgeStats stats={stats} /> : null}

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
