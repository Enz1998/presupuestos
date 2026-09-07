# Condiciones del proyecto

Estas reglas son obligatorias para cualquier persona o agente que trabaje en este repositorio.

## Git y Vercel (producción)

El sitio en uso se publica desde GitHub `master` hacia Vercel. Un `git push` a `master` **cambia producción**.

- **No pushear** (`git push`, `git push -u`, force push, ni a `master` ni a otra rama) **salvo que el usuario lo pida de forma explícita** en el mensaje (“pusheá”, “hacé push”, “subilo a GitHub”, etc.). Un “commit”, “guardá” o “implementá” **no** autoriza push.
- **No mergear a `master`** ni desplegar a Vercel salvo instrucción explícita.
- Trabajar en una rama distinta de `master` cuando haya cambios de código. Commits locales no afectan Vercel hasta que haya push.
- Antes de cualquier push pedido por el usuario: probar a fondo en localhost (`npm run dev` y, si el cambio es de app, también `npm run build` + `npm run start`).

## Base de datos (Supabase)

**No tocar Supabase.** Local y producción usan la misma base. Cualquier cambio ahí afecta el proyecto en uso aunque el código no se suba.

- NUNCA elimines la base de datos ni el proyecto de Supabase, ni lo recréis desde cero.
- Prohibido: `DROP DATABASE`, `DROP TABLE`, `TRUNCATE`, resets, restores destructivos, `scratch_reset.ts` u otros vaciados masivos.
- No cambies el esquema (ni aditivo), políticas RLS, secuencias, ni datos masivos, salvo que el usuario lo pida de forma explícita.
- No ejecutes SQL, migraciones ni scripts contra Supabase “por las dudas” o para facilitar un arreglo de código.
- Borrar un presupuesto o un rango puntual **desde la app** (un registro, para probar el flujo) sigue permitido. Vaciar, migrar o administrar la base no.

## Código

- Los cambios son de código de la app, no de infraestructura de datos ni de deploy, hasta que el usuario lo indique.
- Probar en localhost antes de pedir o hacer push.
