import { supabase } from '../lib/supabase';

function mapReportFromDb(report) {
  return {
    id: report.id,
    name: report.name,
    periodStart: report.period_start,
    periodEnd: report.period_end,
    totalExported: report.total_exported,
    exportedTaskIds: report.exported_task_ids ?? [],
    driveLink: report.drive_link ?? '',
    status: report.status,
    generatedBy: report.generated_by,
    generatedByName: report.generated_by_name,
    generatedAt: report.generated_at,
    cleanedAt: report.cleaned_at,
    notes: report.notes ?? '',
    sectorId: report.sector_ref_id,
  };
}

export async function fetchArchivedReports() {
  const { data, error } = await supabase
    .from('archived_activity_reports')
    .select('*')
    .order('generated_at', { ascending: false });

  if (error) throw error;
  return data.map(mapReportFromDb);
}

export async function createArchivedReport(values, currentUser) {
  const payload = {
    organization_id: currentUser.organizationId,
    name: values.name.trim(),
    period_start: values.periodStart || null,
    period_end: values.periodEnd || null,
    total_exported: values.totalExported,
    exported_task_ids: values.exportedTaskIds,
    status: 'Pendente de Drive',
    generated_by: currentUser.id,
    generated_by_name: currentUser.name,
    generated_at: new Date().toISOString(),
    sector_ref_id: values.sectorId || null,
  };

  const { data, error } = await supabase.from('archived_activity_reports').insert(payload).select('*').single();
  if (error) throw error;
  return mapReportFromDb(data);
}

export async function registerReportDriveLink(reportId, values) {
  const payload = {
    name: values.name.trim(),
    period_start: values.periodStart || null,
    period_end: values.periodEnd || null,
    drive_link: values.driveLink.trim(),
    notes: values.notes?.trim() || null,
    status: 'Salvo no Drive',
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('archived_activity_reports')
    .update(payload)
    .eq('id', reportId)
    .select('*')
    .single();

  if (error) throw error;
  return mapReportFromDb(data);
}

export async function markReportsCleaned(reportIds) {
  const { data, error } = await supabase
    .from('archived_activity_reports')
    .update({ status: 'Limpeza realizada', cleaned_at: new Date().toISOString() })
    .in('id', reportIds)
    .select('*');

  if (error) throw error;
  return data.map(mapReportFromDb);
}

export function subscribeToArchivedReports(onChange) {
  return supabase
    .channel('kanban:archived-reports')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'archived_activity_reports' }, onChange)
    .subscribe();
}
