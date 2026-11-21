-- 004 : inscription par prénom (pas encore de SMS), code de secours, administration,
-- tirage du dimanche (partenaire, lots, gagnants), litiges, participation gratuite.

-- ---------- Comptes ----------
alter table users alter column phone drop not null;
alter table users add column recovery_hash text unique;
alter table users add column is_admin boolean not null default false;
alter table users add column blocked_at timestamptz;
alter table users add column blocked_reason text check (char_length(blocked_reason) <= 300);

-- Ticket "participation gratuite" (voie d'accès sans versement prévue au règlement).
alter table draw_tickets drop constraint draw_tickets_source_check;
alter table draw_tickets add constraint draw_tickets_source_check
  check (source in ('on_time', 'loyalty', 'invite', 'free_entry'));

-- ---------- Tirage du dimanche ----------
create table draws (
  draw_on date primary key check (extract(isodow from draw_on) = 7),
  sponsor_name text check (char_length(btrim(sponsor_name)) between 1 and 80),
  sponsor_contact text check (char_length(sponsor_contact) <= 120),
  status text not null default 'planned' check (status in ('planned', 'done')),
  seed text,
  tickets_count integer,
  drawn_at timestamptz,
  drawn_by uuid references users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table draw_prizes (
  id uuid primary key default gen_random_uuid(),
  draw_on date not null references draws (draw_on) on delete cascade,
  label text not null check (char_length(btrim(label)) between 1 and 80),
  value integer not null check (value between 1 and 100000000),
  quantity integer not null check (quantity between 1 and 1000),
  created_at timestamptz not null default now()
);

create table draw_winners (
  id uuid primary key default gen_random_uuid(),
  draw_on date not null references draws (draw_on) on delete cascade,
  prize_id uuid not null references draw_prizes (id) on delete cascade,
  ticket_id uuid not null unique references draw_tickets (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  delivered_at timestamptz,
  delivered_by uuid references users (id) on delete set null
);
create index draw_winners_user_idx on draw_winners (user_id);

-- ---------- Journal des actions d'administration ----------
create table admin_actions (
  id bigint generated always as identity primary key,
  admin_id uuid not null references users (id) on delete cascade,
  action text not null,
  target_type text not null,
  target_id text not null,
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now()
);
create index admin_actions_created_idx on admin_actions (created_at desc);

create function admin_check(p_admin uuid) returns void
language plpgsql as $$
begin
  if not exists (select 1 from users where id = p_admin and is_admin and blocked_at is null) then
    raise exception 'pepite:not_admin';
  end if;
end $$;

-- Suspendre / rétablir un compte. La suspension ferme toutes ses sessions.
create function admin_set_blocked(p_admin uuid, p_user uuid, p_blocked boolean, p_reason text) returns void
language plpgsql as $$
begin
  perform admin_check(p_admin);
  if p_user = p_admin then
    raise exception 'pepite:bad_request';
  end if;
  update users
  set blocked_at = case when p_blocked then now() end,
      blocked_reason = case when p_blocked then nullif(btrim(p_reason), '') end
  where id = p_user;
  if not found then
    raise exception 'pepite:not_found';
  end if;
  if p_blocked then
    delete from sessions where user_id = p_user;
  end if;
  insert into admin_actions (admin_id, action, target_type, target_id, note)
  values (p_admin, case when p_blocked then 'block' else 'unblock' end, 'user', p_user::text, p_reason);
end $$;

-- Litige : l'admin valide un versement à la place du bénéficiaire ('paid'),
-- ou refuse un reçu et remet le versement en attente ('due').
create function admin_resolve_contribution(p_admin uuid, p_contribution uuid, p_decision text, p_note text)
returns integer language plpgsql as $$
declare
  k contributions%rowtype;
  r rounds%rowtype;
  c circles%rowtype;
  sent timestamptz;
  ticket integer;
begin
  perform admin_check(p_admin);
  if char_length(btrim(coalesce(p_note, ''))) < 3 then
    raise exception 'pepite:note_required';
  end if;
  select * into k from contributions where id = p_contribution for update;
  if not found then
    raise exception 'pepite:not_found';
  end if;
  if k.status = 'paid' then
    raise exception 'pepite:already_paid';
  end if;
  select * into r from rounds where id = k.round_id;
  select * into c from circles where id = r.circle_id;

  if p_decision = 'paid' then
    sent := coalesce(k.sent_at, now());
    update contributions
    set status = 'paid', method = coalesce(method, 'cash'), sent_at = sent,
        validated_at = now(), validated_by = p_admin
    where id = k.id;
    -- Acteur vide : le fil affiche « le support Pépite ».
    insert into events (circle_id, kind, actor_id, target_id, amount)
    values (c.id, 'contribution_validated', null, k.member_id, c.amount);
    if (sent at time zone 'Africa/Lome')::date <= r.due_on then
      ticket := issue_ticket(k.member_id, 'on_time', c.name || ', tour ' || r.number, k.id);
    end if;
    if not exists (
      select 1 from contributions k2 join rounds r2 on r2.id = k2.round_id
      where r2.circle_id = c.id and k2.status <> 'paid'
    ) then
      update circles set status = 'completed' where id = c.id;
    end if;
  elsif p_decision = 'due' then
    if k.status <> 'sent' then
      raise exception 'pepite:bad_request';
    end if;
    update contributions
    set status = 'due', method = null, reference = null, sent_at = null
    where id = k.id;
  else
    raise exception 'pepite:bad_request';
  end if;

  insert into admin_actions (admin_id, action, target_type, target_id, note)
  values (p_admin, 'resolve_' || p_decision, 'contribution', k.id::text, btrim(p_note));
  return ticket;
end $$;

-- Participation gratuite : un ticket accordé sur demande, sans versement.
create function admin_free_ticket(p_admin uuid, p_user uuid, p_note text) returns integer
language plpgsql as $$
declare
  n integer;
begin
  perform admin_check(p_admin);
  if not exists (select 1 from users where id = p_user and blocked_at is null) then
    raise exception 'pepite:not_found';
  end if;
  n := issue_ticket(p_user, 'free_entry', 'Participation gratuite (règlement)', null);
  if n is null then
    raise exception 'pepite:max_tickets';
  end if;
  insert into admin_actions (admin_id, action, target_type, target_id, note)
  values (p_admin, 'free_ticket', 'user', p_user::text, p_note);
  return n;
end $$;

-- Tirage du dimanche : à partir de 20 h (heure de Lomé), chaque ticket est classé
-- selon md5(code || numéro) et les lots sont attribués dans l'ordre, du plus gros au plus petit.
create function run_draw(p_admin uuid, p_draw_on date, p_seed text) returns integer
language plpgsql as $$
declare
  d draws%rowtype;
  winners integer;
  total integer;
begin
  perform admin_check(p_admin);
  select * into d from draws where draw_on = p_draw_on for update;
  if not found then
    raise exception 'pepite:not_found';
  end if;
  if d.status = 'done' then
    raise exception 'pepite:draw_done';
  end if;
  if now() < (p_draw_on + time '20:00') at time zone 'Africa/Lome' then
    raise exception 'pepite:draw_too_early';
  end if;
  if not exists (select 1 from draw_prizes where draw_on = p_draw_on) then
    raise exception 'pepite:no_prizes';
  end if;

  with t as (
    select id, user_id, row_number() over (order by md5(p_seed || number::text)) as rn
    from draw_tickets where draw_on = p_draw_on
  ),
  p as (
    select pr.id, row_number() over (order by pr.value desc, pr.created_at, g) as rn
    from draw_prizes pr, generate_series(1, pr.quantity) g
    where pr.draw_on = p_draw_on
  )
  insert into draw_winners (draw_on, prize_id, ticket_id, user_id)
  select p_draw_on, p.id, t.id, t.user_id from p join t on t.rn = p.rn;
  get diagnostics winners = row_count;

  select count(*) into total from draw_tickets where draw_on = p_draw_on;
  update draws
  set status = 'done', seed = p_seed, tickets_count = total, drawn_at = now(), drawn_by = p_admin
  where draw_on = p_draw_on;

  insert into admin_actions (admin_id, action, target_type, target_id, note)
  values (p_admin, 'run_draw', 'draw', p_draw_on::text, winners || ' gagnant(s) sur ' || total || ' ticket(s)');
  return winners;
end $$;
