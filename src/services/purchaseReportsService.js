import { supabase } from '../lib/supabase';

function mapReportFromDb(report) {
  return {
    id: report.id,
    name: report.name,
    periodStart: report.period_start,
    periodEnd: report.period_end,
    totalExported: report.total_exported,
    exportedRequestIds: report.exported_request_ids ?? [],
    driveLink: report.drive_link ?? '',
    status: report.status,
    generatedBy: report.generated_by,
    generatedByName: report.generated_by_name,
    generatedAt: report.generated_at,
    notes: report.notes ?? '',
  };
}

export async function fetchPurchaseReports() {
  const { data, error } = await supabase
    .from('purchase_request_reports')
    .select('*')
    .order('generated_at', { ascending: false });

  if (error) throw error;
  return data.map(mapReportFromDb);
}

export async function createPurchaseReport(values, currentUser) {
  const payload = {
    organization_id: currentUser.organizationId,
    name: values.name.trim(),
    period_start: values.periodStart || null,
    period_end: values.periodEnd || null,
    total_exported: values.totalExported,
    exported_request_ids: values.exportedRequestIds,
    status: 'Pendente de Drive',
    generated_by: currentUser.id,
    generated_by_name: currentUser.name,
    generated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('purchase_request_reports').insert(payload).select('*').single();
  if (error) throw error;
  return mapReportFromDb(data);
}

export async function registerPurchaseReportDriveLink(reportId, values) {
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
    .from('purchase_request_reports')
    .update(payload)
    .eq('id', reportId)
    .select('*')
    .single();

  if (error) throw error;
  return mapReportFromDb(data);
}

export function subscribeToPurchaseReports(onChange) {
  return supabase
    .channel('purchase-requests:reports')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_request_reports' }, onChange)
    .subscribe();
}
