import { ArrowLeft, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import KnowledgeCard from '../components/knowledge/KnowledgeCard';
import KnowledgeDetailsModal from '../components/knowledge/KnowledgeDetailsModal';
import KnowledgeEmptyState from '../components/knowledge/KnowledgeEmptyState';
import KnowledgeFilters from '../components/knowledge/KnowledgeFilters';
import KnowledgeFormModal from '../components/knowledge/KnowledgeFormModal';
import KnowledgeStats from '../components/knowledge/KnowledgeStats';
import PermissionNotice from '../components/common/PermissionNotice';
import { useAuth } from '../contexts/AuthContext';
import usePermissionNotice from '../hooks/usePermissionNotice';
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
import { canManageSector } from '../utils/permissions';

function SectorKnowledge({ knowledgeSectorId, onBackToSectors }) {
  const { currentUser } = useAuth();
  const [sector, setSector] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ query: '', type: 'Todos' });
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [detailRecord, setDetailRecord] = useState(null);
  const { permissionNotice, showPermissionNotice } = usePermissionNotice();

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

  const simplified = sector?.slug === 'projetos';
  const canEditSector = canManageSector(currentUser, sector);

  const filteredRecords = useMemo(
    () => (sector ? filterKnowledgeRecords(records, sector.name, filters) : []),
    [records, sector, filters],
  );

  const stats = useMemo(() => (sector ? getKnowledgeStats(records, sector.name) : null), [records, sector]);

  const handleSubmit = async (values) => {
    if (!sector) return;
    if (!canEditSector) return showPermissionNotice();

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
    if (!canEditSector) return showPermissionNotice();
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
            {simplified
              ? 'Centralize os documentos dos projetos com nome, descricao e link do Drive.'
              : 'Organize manuais do setor, POPs, documentos e outros arquivos internos em um unico lugar.'}
          </p>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={(event) => {
            if (!canEditSector) return showPermissionNotice(event);
            setEditingRecord(null);
            setFormOpen(true);
          }}
        >
          <Plus size={17} aria-hidden="true" />
          Novo documento
        </button>
      </section>

      {error ? <div className="members-feedback error">{error}</div> : null}
      <PermissionNotice notice={permissionNotice} />

      {stats ? <KnowledgeStats stats={stats} simplified={simplified} /> : null}

      <section className="panel knowledge-toolbar">
        <KnowledgeFilters filters={filters} onChange={setFilters} simplified={simplified} />
      </section>

      <section className="knowledge-grid" aria-label={`Documentos do setor ${sector.name}`}>
        {filteredRecords.length > 0 ? (
          filteredRecords.map((record) => (
            <KnowledgeCard
              key={record.id}
              record={record}
              onView={setDetailRecord}
              onEdit={(item) => {
                if (!canEditSector) return showPermissionNotice();
                setEditingRecord(item);
                setFormOpen(true);
              }}
              onDelete={handleDelete}
              canEdit={canEditSector}
              onBlockedAction={showPermissionNotice}
              simplified={simplified}
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
          simplified={simplified}
        />
      ) : null}

      {detailRecord ? (
        <KnowledgeDetailsModal
          record={detailRecord}
          onClose={() => setDetailRecord(null)}
          onEdit={(record) => {
            if (!canEditSector) return showPermissionNotice();
            setDetailRecord(null);
            setEditingRecord(record);
            setFormOpen(true);
          }}
          simplified={simplified}
        />
      ) : null}
    </div>
  );
}

export default SectorKnowledge;
