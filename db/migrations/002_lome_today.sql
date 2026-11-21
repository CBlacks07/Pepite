-- Date du jour à Lomé (UTC toute l'année), utilisée par les requêtes de l'API.
create function lome_today() returns date
language sql stable as $$
  select (now() at time zone 'Africa/Lome')::date
$$;
