-- Pépite : schéma initial.
-- Les règles métier vivent dans des fonctions plpgsql : chaque appel depuis l'API
-- est une seule instruction, donc atomique. Les erreurs attendues sont levées
-- avec un message "pepite:<code>" que l'API traduit en réponse HTTP.

create table users (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  display_name text check (char_length(btrim(display_name)) between 1 and 40),
  created_at timestamptz not null default now()
);

create table otp_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index otp_codes_phone_idx on otp_codes (phone, created_at desc);

create table sessions (
  token_hash text primary key,
  user_id uuid not null references users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index sessions_user_idx on sessions (user_id);

create table circles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 40),
  amount integer not null check (amount between 1 and 10000000),
  -- Franc CFA (UEMOA, Togo). Montants entiers, sans centimes.
  currency text not null default 'XOF' check (currency = 'XOF'),
  frequency text not null check (frequency in ('weekly', 'monthly')),
  size integer not null check (size between 3 and 20),
  new_members_last boolean not null default true,
  deposit_required boolean not null default false,
  invite_code text not null unique check (invite_code ~ '^[A-Z0-9]{6}$'),
  status text not null default 'forming' check (status in ('forming', 'active', 'completed')),
  draw_seed text,
  drawn_at timestamptz,
  starts_on date,
  created_by uuid not null references users (id),
  created_at timestamptz not null default now()
);

create table circle_members (
  circle_id uuid not null references circles (id) on delete cascade,
  user_id uuid not null references users (id),
  role text not null default 'member' check (role in ('organizer', 'member')),
  position integer check (position >= 1),
  is_new boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (circle_id, user_id),
  unique (circle_id, position)
);
create index circle_members_user_idx on circle_members (user_id);

create table rounds (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references circles (id) on delete cascade,
  number integer not null check (number >= 1),
  beneficiary_id uuid not null references users (id),
  due_on date not null,
  unique (circle_id, number)
);

create table contributions (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds (id) on delete cascade,
  member_id uuid not null references users (id),
  status text not null default 'due' check (status in ('due', 'sent', 'paid')),
  -- method est vide pour la part du bénéficiaire, comptée d'office.
  method text check (method in ('mobile_money', 'bank_transfer', 'cash')),
  reference text check (char_length(reference) <= 80),
  sent_at timestamptz,
  validated_at timestamptz,
  validated_by uuid references users (id),
  unique (round_id, member_id)
);
create index contributions_member_idx on contributions (member_id);

create table reminders (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds (id) on delete cascade,
  from_user uuid not null references users (id),
  to_user uuid not null references users (id),
  message text not null check (char_length(btrim(message)) between 1 and 500),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index reminders_to_idx on reminders (to_user, created_at desc);

create table draw_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  draw_on date not null,
  number integer not null check (number between 10000 and 99999),
  source text not null check (source in ('on_time', 'loyalty', 'invite')),
  detail text,
  contribution_id uuid unique references contributions (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (draw_on, number)
);
create index draw_tickets_user_idx on draw_tickets (user_id, draw_on);

create table events (
  id bigint generated always as identity primary key,
  circle_id uuid not null references circles (id) on delete cascade,
  kind text not null check (kind in ('joined', 'order_drawn', 'contribution_sent', 'contribution_validated')),
  actor_id uuid references users (id),
  target_id uuid references users (id),
  amount integer,
  created_at timestamptz not null default now()
);
create index events_circle_idx on events (circle_id, created_at desc);

-- Prochain tirage du dimanche (20 h, heure de Lomé). Le dimanche après 20 h,
-- c'est le dimanche suivant.
create function next_draw_on(at timestamptz default now()) returns date
language sql stable as $$
  select case
    when extract(isodow from l) = 7 and l::time < time '20:00' then l::date
    when extract(isodow from l) = 7 then l::date + 7
    else l::date + (7 - extract(isodow from l)::int)
  end
  from (select at at time zone 'Africa/Lome' as l) s
$$;

-- Donne un ticket pour le prochain tirage, dans la limite de 4 par personne.
-- Renvoie le numéro du ticket, ou null si la limite est atteinte.
create function issue_ticket(p_user uuid, p_source text, p_detail text, p_contribution uuid)
returns integer language plpgsql as $$
declare
  d date := next_draw_on();
  n integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user::text || d::text, 0));
  if (select count(*) from draw_tickets where user_id = p_user and draw_on = d) >= 4 then
    return null;
  end if;
  loop
    n := 10000 + floor(random() * 90000)::int;
    insert into draw_tickets (user_id, draw_on, number, source, detail, contribution_id)
    values (p_user, d, n, p_source, p_detail, p_contribution)
    on conflict (draw_on, number) do nothing;
    exit when found;
  end loop;
  return n;
end $$;

create function create_circle(
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
  values (cid, p_user, 'organizer', false);
  return cid;
end $$;

create function join_circle(p_user uuid, p_code text) returns uuid
language plpgsql as $$
declare
  c circles%rowtype;
  first_circle boolean;
begin
  select * into c from circles where invite_code = upper(btrim(p_code)) for update;
  if not found then
    raise exception 'pepite:invalid_code';
  end if;
  if exists (select 1 from circle_members where circle_id = c.id and user_id = p_user) then
    return c.id;
  end if;
  if c.status <> 'forming' then
    raise exception 'pepite:circle_started';
  end if;
  if (select count(*) from circle_members where circle_id = c.id) >= c.size then
    raise exception 'pepite:circle_full';
  end if;

  first_circle := not exists (select 1 from circle_members where user_id = p_user);

  insert into circle_members (circle_id, user_id, role, is_new)
  values (
    c.id, p_user, 'member',
    -- "Nouveau" = aucun versement validé dans un autre cercle.
    not exists (
      select 1 from contributions where member_id = p_user and status = 'paid' and method is not null
    )
  );
  insert into events (circle_id, kind, actor_id) values (c.id, 'joined', p_user);

  -- 1 ticket pour l'organisateur quand une personne invitée rejoint son premier cercle.
  if first_circle then
    perform issue_ticket(c.created_by, 'invite',
      coalesce((select display_name from users where id = p_user), 'Un invité') || ' a rejoint ' || c.name, null);
  end if;
  return c.id;
end $$;

create function draw_order(p_user uuid, p_circle uuid, p_seed text, p_starts_on date) returns void
language plpgsql as $$
declare
  c circles%rowtype;
  step interval;
begin
  select * into c from circles where id = p_circle for update;
  if not found then
    raise exception 'pepite:not_found';
  end if;
  if c.created_by <> p_user then
    raise exception 'pepite:not_organizer';
  end if;
  if c.status <> 'forming' then
    raise exception 'pepite:already_drawn';
  end if;
  if (select count(*) from circle_members where circle_id = c.id) <> c.size then
    raise exception 'pepite:circle_not_full';
  end if;
  if p_starts_on < (now() at time zone 'Africa/Lome')::date then
    raise exception 'pepite:bad_start';
  end if;

  step := case c.frequency when 'weekly' then interval '1 week' else interval '1 month' end;

  -- Ordre vérifiable : tri par md5(code || identifiant), nouveaux en dernier si l'option est active.
  with ordered as (
    select m.user_id,
           row_number() over (
             order by case when c.new_members_last and m.is_new then 1 else 0 end,
                      md5(p_seed || m.user_id::text)
           ) as pos
    from circle_members m
    where m.circle_id = c.id
  )
  update circle_members m set position = o.pos
  from ordered o
  where m.circle_id = c.id and m.user_id = o.user_id;

  insert into rounds (circle_id, number, beneficiary_id, due_on)
  select c.id, m.position, m.user_id, (p_starts_on + (m.position - 1) * step)::date
  from circle_members m
  where m.circle_id = c.id;

  insert into contributions (round_id, member_id, status, sent_at, validated_at, validated_by)
  select r.id, m.user_id,
         case when m.user_id = r.beneficiary_id then 'paid' else 'due' end,
         case when m.user_id = r.beneficiary_id then now() end,
         case when m.user_id = r.beneficiary_id then now() end,
         case when m.user_id = r.beneficiary_id then m.user_id end
  from rounds r
  join circle_members m on m.circle_id = r.circle_id
  where r.circle_id = c.id;

  update circles
  set status = 'active', draw_seed = p_seed, drawn_at = now(), starts_on = p_starts_on
  where id = c.id;

  insert into events (circle_id, kind, actor_id) values (c.id, 'order_drawn', p_user);
end $$;

create function declare_contribution(p_user uuid, p_round uuid, p_method text, p_reference text) returns void
language plpgsql as $$
declare
  r rounds%rowtype;
  k contributions%rowtype;
  amt integer;
begin
  select * into r from rounds where id = p_round;
  if not found then
    raise exception 'pepite:not_found';
  end if;
  select * into k from contributions where round_id = p_round and member_id = p_user for update;
  if not found then
    raise exception 'pepite:not_member';
  end if;
  if r.beneficiary_id = p_user then
    raise exception 'pepite:own_round';
  end if;
  if k.status = 'paid' then
    raise exception 'pepite:already_paid';
  end if;

  update contributions
  set status = 'sent', method = p_method, reference = nullif(btrim(p_reference), ''),
      sent_at = coalesce(sent_at, now())
  where id = k.id;

  select amount into amt from circles where id = r.circle_id;
  insert into events (circle_id, kind, actor_id, target_id, amount)
  values (r.circle_id, 'contribution_sent', p_user, r.beneficiary_id, amt);
end $$;

-- Le bénéficiaire valide un versement (reçu envoyé, ou espèces remises en main propre).
-- Renvoie le numéro du ticket gagné par le membre, ou null.
create function validate_contribution(p_user uuid, p_round uuid, p_member uuid) returns integer
language plpgsql as $$
declare
  r rounds%rowtype;
  c circles%rowtype;
  k contributions%rowtype;
  sent timestamptz;
  ticket integer;
begin
  select * into r from rounds where id = p_round;
  if not found then
    raise exception 'pepite:not_found';
  end if;
  if r.beneficiary_id <> p_user then
    raise exception 'pepite:not_beneficiary';
  end if;
  select * into c from circles where id = r.circle_id;
  select * into k from contributions where round_id = p_round and member_id = p_member for update;
  if not found then
    raise exception 'pepite:not_member';
  end if;
  if k.status = 'paid' then
    raise exception 'pepite:already_paid';
  end if;

  sent := coalesce(k.sent_at, now());
  update contributions
  set status = 'paid', method = coalesce(method, 'cash'), sent_at = sent,
      validated_at = now(), validated_by = p_user
  where id = k.id;

  insert into events (circle_id, kind, actor_id, target_id, amount)
  values (c.id, 'contribution_validated', p_user, p_member, c.amount);

  if (sent at time zone 'Africa/Lome')::date <= r.due_on then
    ticket := issue_ticket(p_member, 'on_time', c.name || ', tour ' || r.number, k.id);
  end if;

  if not exists (
    select 1 from contributions k2 join rounds r2 on r2.id = k2.round_id
    where r2.circle_id = c.id and k2.status <> 'paid'
  ) then
    update circles set status = 'completed' where id = c.id;
  end if;

  return ticket;
end $$;

create function send_reminder(p_user uuid, p_round uuid, p_member uuid, p_message text) returns void
language plpgsql as $$
declare
  r rounds%rowtype;
begin
  select * into r from rounds where id = p_round;
  if not found then
    raise exception 'pepite:not_found';
  end if;
  if not exists (select 1 from circle_members where circle_id = r.circle_id and user_id = p_user) then
    raise exception 'pepite:not_member';
  end if;
  if p_member = p_user then
    raise exception 'pepite:bad_request';
  end if;
  if not exists (select 1 from contributions where round_id = p_round and member_id = p_member and status = 'due') then
    raise exception 'pepite:not_due';
  end if;
  if exists (
    select 1 from reminders
    where round_id = p_round and from_user = p_user and to_user = p_member
      and created_at > now() - interval '24 hours'
  ) then
    raise exception 'pepite:already_reminded';
  end if;
  insert into reminders (round_id, from_user, to_user, message)
  values (p_round, p_user, p_member, btrim(p_message));
end $$;
