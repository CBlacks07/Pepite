-- 005 : limitation de débit (inscriptions, codes de secours essayés au hasard).
-- Fenêtres fixes : une ligne par (compteur, empreinte de l'adresse IP, début de fenêtre).
-- On ne garde que l'empreinte SHA-256 de l'adresse, jamais l'adresse elle-même,
-- et les lignes de plus de deux jours sont effacées au fil de l'eau.

create table rate_limits (
  bucket text not null,
  key_hash text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (bucket, key_hash, window_start)
);
create index rate_limits_window_idx on rate_limits (window_start);

-- Renvoie le nombre d'essais dans la fenêtre en cours, après ajout de celui-ci
-- si p_increment est vrai (sinon, se contente de lire le compteur).
create function rate_limit(p_bucket text, p_key text, p_window_seconds integer, p_increment boolean)
returns integer language plpgsql as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  n integer;
begin
  if p_increment then
    insert into rate_limits (bucket, key_hash, window_start, hits)
    values (p_bucket, p_key, w, 1)
    on conflict (bucket, key_hash, window_start) do update set hits = rate_limits.hits + 1
    returning hits into n;
    -- Ménage occasionnel des vieilles fenêtres.
    if random() < 0.02 then
      delete from rate_limits where window_start < now() - interval '2 days';
    end if;
  else
    select hits into n from rate_limits where bucket = p_bucket and key_hash = p_key and window_start = w;
  end if;
  return coalesce(n, 0);
end $$;
