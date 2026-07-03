# Guía de lanzamiento — RecastWise (sitio #2) 🚀

El sitio ya está construido, verificado y en GitHub
(`github.com/joseangel2510/mortgage-recast`). Los pasos son los MISMOS que hiciste con
PaydayCal — aquí va el resumen con lo específico de este sitio. Para el detalle largo de
cada plataforma, mira también `../../paycheck-calendar/docs/LANZAMIENTO.md`.

## 1. Vercel (5 min)
- [vercel.com](https://vercel.com) → Add New → Project → importa **mortgage-recast** → Deploy.
- Astro se detecta solo. Queda vivo en `mortgage-recast-xxxx.vercel.app`.

## 2. Dominio (~$10/año)
- Cómpralo en **Hostinger** (donde ya tienes el otro) o donde prefieras.
- Candidatos, en orden: `recastwise.com` → `recastcalc.com` → `mortgagerecastcalc.com`.
- Conéctalo en Vercel (Settings → Domains) y agrega los registros DNS en Hostinger (hpanel → Domains → DNS).
- **Avísame el dominio final:** actualizo `SITE_URL` y `CONTACT_EMAIL` en `src/config.ts` (1 push).

## 3. Email de contacto
- Mismo método que PaydayCal: **ImprovMX** gratis → alias `contact@turecast-dominio.com` → tu Gmail del negocio.
- Agrega los 2 MX + 1 TXT (SPF) de ImprovMX en el DNS de Hostinger.

## 4. Search Console + Bing
- [search.google.com/search-console](https://search.google.com/search-console/welcome) → propiedad **Dominio** → verifica con TXT en Hostinger → envía `sitemap-index.xml`.
- Importa a Bing en [bing.com/webmasters](https://www.bing.com/webmasters) (botón Import).

## 5. AdSense
- **Puedes usar la MISMA cuenta de AdSense** de PaydayCal — una cuenta admite varios sitios. En AdSense: **Sites → Add site → recastwise.com**.
- (Si PaydayCal aún no está aprobado, no pasa nada: agrega este sitio a la misma cuenta; cada uno se revisa por separado.)
- Verifica el sitio (snippet en `<head>` + `ads.txt`) → **Request review**.
- Al aprobar: pega tu `ca-pub-...` en `ADSENSE_CLIENT_ID` de `src/config.ts` y reemplaza `public/ads.txt` con tu línea. Me lo pasas y lo hago en minutos.
- Igual que antes: **NO apliques el día 1** — deja indexar y promocionar 2–3 semanas primero.

## 6. Promoción (este sitio es MÁS lento de posicionar — es normal)
Hipotecas es categoría "YMYL": Google tarda más en confiar en un dominio nuevo (6–12 meses para las búsquedas grandes). Por eso la promoción activa importa aún más aquí:

- **Reddit:** r/personalfinance (solo comentarios útiles), r/RealEstate, r/FirstTimeHomeBuyer, r/Mortgages. Formato: responde a gente preguntando "should I recast or refinance / pay extra?" con el link como herramienta que hace la comparación.
- **Pinterest:** pines tipo "Recast vs Refinance vs Extra Principal — which is cheapest?" (te puedo generar los pines como hice con PaydayCal, avísame).
- **TikTok:** el gancho viral ya probado en este nicho: *"The mortgage move banks don't advertise: recast lowers your payment without refinancing."*
- **El ángulo ganador del sitio** (que ningún competidor tiene): la comparación de 3 vías con gráfico y el dato de que *extra principal siempre cuesta menos interés que recast* — contenido que la gente comparte.

## Por qué este sitio (recordatorio)
- Ingreso por visita MÁS alto del portafolio ($15–40 RPM; audiencia = dueños de casa con dinero, a quienes los bancos pagan caro por alcanzar).
- A cambio, tráfico más lento que PaydayCal. Es la apuesta de mayor valor a mediano plazo.

## Estado técnico
- 21 páginas, motor de amortización con 16 tests, 26 checks E2E, Lighthouse perf 86 / a11y 99 / SEO 100 / best-practices 100.
- Diseño deliberadamente distinto a PaydayCal (fintech navy/teal) para que no parezcan la misma plantilla.

---
**Siguiente:** cuando este esté desplegado y con AdSense en revisión, arrancamos el **sitio #3: Wage Garnishment Calculator** (el de RPM más alto de los tres).
