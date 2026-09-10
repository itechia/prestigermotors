-- Endurecimento do bucket "uploads".
--
-- Antes: a policy de INSERT valia para TODOS os papéis (inclusive anon), sem
-- restringir o caminho. Como a chave anon fica no bundle público do site,
-- qualquer pessoa da internet conseguia gravar arquivos no bucket. Confirmado
-- em teste: upload anônimo na raiz respondia 200.
--
-- Agora: o visitante anônimo só escreve em "propostas/" (fotos enviadas no
-- formulário "vender meu veículo"); apagar e sobrescrever exigem papel de
-- administrador; SVG sai da lista de tipos aceitos.
begin;

drop policy if exists arquivos_upload_publico on storage.objects;

create policy arquivos_upload_propostas_anon on storage.objects
  for insert to anon
  with check (
    bucket_id = 'uploads'
    and (storage.foldername(name))[1] = 'propostas'
  );

drop policy if exists arquivos_upload_admin on storage.objects;
create policy arquivos_upload_admin on storage.objects
  for insert to authenticated
  with check (bucket_id = 'uploads');

-- Antes qualquer usuário autenticado (inclusive vendedor) podia apagar as
-- fotos de todo o catálogo.
drop policy if exists arquivos_remocao_admin on storage.objects;
create policy arquivos_remocao_admin on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'uploads'
    and private.current_user_role() in ('admin', 'super_admin')
  );

drop policy if exists arquivos_atualizacao_admin on storage.objects;
create policy arquivos_atualizacao_admin on storage.objects
  for update to authenticated
  using (
    bucket_id = 'uploads'
    and private.current_user_role() in ('admin', 'super_admin')
  )
  with check (
    bucket_id = 'uploads'
    and private.current_user_role() in ('admin', 'super_admin')
  );

-- Leitura pública continua: o bucket guarda as fotos do catálogo.
drop policy if exists arquivos_leitura_publica on storage.objects;
create policy arquivos_leitura_publica on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'uploads');

-- SVG aceita <script> e o bucket é público.
update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    file_size_limit = 5242880
where id = 'uploads';

commit;
