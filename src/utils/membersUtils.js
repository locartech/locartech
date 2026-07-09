export function getMemberStats(members) {
  return {
    total: members.length,
    active: members.filter((member) => member.status === 'Ativo').length,
    inactive: members.filter((member) => member.status === 'Inativo').length,
    sectors: new Set(members.map((member) => member.sector)).size,
  };
}
