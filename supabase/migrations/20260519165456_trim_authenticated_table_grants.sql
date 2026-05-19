begin;

revoke all on table public.vehicles from authenticated;
grant select, insert, update, delete on table public.vehicles to authenticated;

revoke all on table public.vehicle_sales from authenticated;
grant select, insert, update, delete on table public.vehicle_sales to authenticated;

commit;
