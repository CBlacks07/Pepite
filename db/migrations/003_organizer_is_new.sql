-- Équité du tirage : l'organisateur est "nouveau" selon le même critère que les
-- autres membres (aucun versement validé dans un autre cercle). Avant, il était
-- toujours considéré comme ancien, donc toujours devant les nouveaux.
create or replace function create_circle(
  p_user uuid, p_name text, p_amount integer, p_frequency text,
  p_size integer, p_new_last boolean, p_deposit boolean, p_code text
) returns uuid language plpgsql as $$
declare
  cid uuid;
begin
  insert into circles (name, amount, frequency, size, new_members_last, deposit_required, invite_code, created_by)
  values (btrim(p_name), p_amount, p_frequency, p_size, p_new_last, p_deposit, p_code, p_user)
  returning id into cid;
  insert into circle_members (circle_id, user_id, role, is_new)
  values (
    cid, p_user, 'organizer',
    not exists (
      select 1 from contributions where member_id = p_user and status = 'paid' and method is not null
    )
  );
  return cid;
end $$;
