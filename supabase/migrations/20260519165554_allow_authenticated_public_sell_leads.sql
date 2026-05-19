begin;

drop policy if exists propostas_insercao_authenticated on public.sell_leads;

create policy propostas_insercao_authenticated on public.sell_leads
  for insert to authenticated
  with check (true);

commit;
