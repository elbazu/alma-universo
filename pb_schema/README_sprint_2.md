# Sprint 2 — PocketBase schema additions

This sprint adds one collection: `community_settings`.

## Importar la colección

1. Abrir el admin de PocketBase:
   https://momatwork-pocketbase-alma-staging.weupli.easypanel.host/_/
2. Ir a **Settings → Import collections**.
3. Pegar el contenido de `collections_sprint_2.json`.
4. Revisar en el preview y confirmar.

La colección es aditiva — no toca las 14 colecciones de Sprint 0.

## Crear el registro semilla

`community_settings` está pensada como **singleton** (un solo registro). El campo `singleton_key` tiene índice único, así que no se pueden crear dos filas con la misma clave.

1. En el admin, abrir la colección `community_settings` → **New record**.
2. Copiar los valores de `seed_community_settings.json`:
   - `singleton_key`: `main`
   - `name`: `Mi Alma en el Universo`
   - `description`: `Un espacio para conectar cuerpo, mente y espíritu — cursos, meditaciones y comunidad.`
   - `url_slug`: `mi-alma`
   - `is_public`: ✓ (true)
   - `support_email`: `zuniga.elba@gmail.com`
   - `show_classroom_tab`: ✓
   - `show_calendar_tab`: ✓
   - `show_map_tab`: ✗
   - `show_members_tab`: ✓
   - `show_about_tab`: ✓
3. Guardar.
4. (Opcional) Subir un icono (128×128) y un cover (1084×576) — si se dejan vacíos, el frontend usa el fallback de `content/community.json`.

## Reglas de acceso

- **Read (list + view):** público — cualquier visitante puede leer los settings del hub (necesario para renderizar la home).
- **Create + Update:** solo Alma (`@request.auth.email = "zuniga.elba@gmail.com"`).
- **Delete:** nadie desde la API (se hace manualmente si hace falta).

Si en el futuro hay más admins, cambiar la regla a un campo `role` en la colección `users`. Para beta con un solo creador, el email literal es más simple de auditar.

## Fallback

Si PocketBase está caído o la colección no existe, el frontend cae a `content/community.json`. Eso garantiza que el sitio renderice en cualquier caso.
