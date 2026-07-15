-- New sector so "Operacao" accounts (restricted to Solicitacoes de compras only)
-- have a real sector_ref_id, same as every other seeded sector.
insert into public.sectors (organization_id, slug, name, description, initial_manager_name)
select o.id, v.slug, v.name, v.description, v.manager
from public.organizations o
cross join (
  values
    ('operacoes', 'Operações', 'Equipe de campo que solicita compras para a obra.', null)
) as v(slug, name, description, manager)
where o.slug = 'locartech'
  and not exists (
    select 1 from public.sectors s where s.organization_id = o.id and s.slug = v.slug
  );
