# Corrección propuesta de atribución

Preparada el 20/10/2026. **Rama para revisión: sin merge, despliegue, cambios en GTM/GA4, nuevas etiquetas ni campañas.**

## Cambio

La versión anterior sustituye page_location por una URL sin consulta y page_referrer por vacío. Esto elimina tanto datos arbitrarios como información válida de campaña. Se conserva la URL canónica y se reconstruye una consulta nueva a partir de una política cerrada; no se modifica la URL del navegador ni los enlaces de WhatsApp.

| Parámetro | Condición |
| --- | --- |
| gclid, gbraid, wbraid | Token opaco de 20 a 512 caracteres ASCII alfanuméricos, guion o guion bajo; exige letras y números. No texto libre, correos, URL anidada, valores solo numéricos ni decodificación recursiva. |
| gad_source | Entero positivo de uno a tres dígitos, sin ceros iniciales. |
| gad_campaignid | Coincidencia exacta con un ID verificado y registrado en adsCampaignIds, además de su validación de formato en la configuración. Lista vacía por ahora. |
| utm_source | google |
| utm_medium | cpc |
| utm_campaign | ppr_mexico_15d, ppr_queretaro_15d |
| utm_id | ppr_mx_15d, ppr_qro_15d |
| utm_term | plan_personal_de_retiro, contratar_ppr, asesoria_ppr |
| utm_content | rsa_ppr_contratar, rsa_ppr_asesoria |

Los nombres PPR son vocabulario técnico propuesto para la prueba; no crean una campaña ni deciden su ubicación. No usar inserción dinámica de búsquedas ni texto escrito por visitantes en UTM. Nuevas campañas o fuentes etiquetadas requieren registrar sus valores antes de usarlos.

Se eliminan todos los demás parámetros y el fragmento. Un parámetro repetido, incluso mediante variantes de mayúsculas o nombres codificados equivalentes, se descarta por completo. Las consultas mayores de 4096 caracteres se descartan. Los nombres admitidos son sensibles a mayúsculas. Los datos excluidos se ignoran; no se registran en mensajes de diagnóstico ni en nuevos eventos.

Los identificadores opacos requieren una precisión: el navegador puede validar su sintaxis, pero no demostrar que Google los emitió ni detectar cualquier dato deliberadamente codificado para parecer un token. No se promete anonimato o detección universal de datos personales. El ID de campaña, al ser un número indistinguible de un teléfono por formato, exige además registro previo. No añadir IDs ficticios de prueba a la configuración productiva.

## Referente: conviene recuperar el origen de manera limitada

El referente es una señal de fuente cuando no hay etiquetado de campaña o integración que aporte esa información. Enviarlo siempre vacío puede ocultar búsquedas y referencias nuevas, aunque no necesariamente reemplaza la fuente de una sesión ya atribuida.

La propuesta admite únicamente el origen (protocolo y dominio) de nombres exactos conocidos: Google .com y .com.mx, Bing, DuckDuckGo, Yahoo Search y los dominios sociales enumerados en measurement-init.js. También admite el propio origen para navegación interna. Omite siempre rutas, consultas, fragmentos, credenciales y puertos no estándar. Un subdominio no enumerado o dominio desconocido produce vacío; no se reduce cualquier URL a su dominio porque un hostname arbitrario también podría contener datos privados.

Se mantiene el meta referrer=no-referrer de ambas páginas y los enlaces externos protegidos: no se amplía la información que la landing envía al navegar a WhatsApp. Esa política de salida es independiente del referente de entrada utilizado aquí.

Límite: las fuentes no enumeradas y los navegadores que suprimen document.referrer no pueden recuperarse con este cambio. No se recrean búsquedas, rutas privadas ni datos que el navegador haya omitido. La clasificación final de canal debe comprobarse en GA4; el test local solo demuestra el parámetro preparado.

## Ejemplos reproducibles

Token ficticio de prueba: Cj0KCQ_SYNTHETIC_TEST_Abc123xyz456. No representa un clic real.

- Válida: `/?utm_source=google&utm_medium=cpc&utm_campaign=ppr_mexico_15d&gclid=Cj0KCQ_SYNTHETIC_TEST_Abc123xyz456&gad_source=1`. Se conservan esos cinco parámetros.
- Mezcla con datos sintéticos: `/?utm_source=google&email=privacy_probe%40example.invalid&phone=524420000000&text=Hola+Prueba&income=50000#privado`. Solo queda utm_source=google.
- UTM inválida: `/?utm_campaign=privacy_probe%40example.invalid&utm_term=524420000000`. No queda consulta.
- Duplicada: `/?utm_source=google&UTM_SOURCE=google`. No queda consulta.
- ID numérico no registrado: `/?gad_campaignid=524420000000`. No queda consulta.
- Referente conocido: `https://www.google.com/search?q=privacy_probe%40example.invalid#privado` pasa a `https://www.google.com/`.
- Referente desconocido: `https://privacy_probe.example.invalid/private` pasa a vacío.

## Consentimiento y duplicación

No se cambian los comandos default/update, su orden, la elección guardada, la caducidad ni la eliminación de cookies. analytics_storage responde a la elección del visitante. ad_storage, ad_user_data y ad_personalization siguen denegados; Signals y personalización siguen desactivados, ads_data_redaction activado y url_passthrough desactivado.

Se conservan el único cargador de GTM, el arranque idempotente, las variables existentes y los tres eventos existentes. No se añade gtag.js, config, page_view manual ni otra etiqueta. Los identificadores conservados no conceden consentimiento ni garantizan exportación de conversiones. La atribución agregada requiere vincular Ads con GA4.

## Pruebas y publicación pendiente

Ejecutar `node test-attribution.cjs`, `node test-consent-init.cjs`, `node test.cjs` y `node test-metrics.cjs`. Las pruebas nuevas ejecutan el bootstrap y la configuración reales en entornos aislados, con URLs válidas/incorrectas, datos personales sintéticos, duplicados, rutas canónicas, referentes, preferencias aceptadas/rechazadas y repetición de arranque. No realizan llamadas a Google ni mensajes de WhatsApp. Los tokens y el ID de campaña del test son ficticios y no se incluyen en producción.

Resultados locales: 86 comprobaciones de atribución aprobadas; regresiones de consentimiento, motor y referencia fiscal aprobadas. El test de navegador test-measurement.cjs se conserva, pero no se declara ejecutado para esta rama. No se ha verificado el envío de este código nuevo al contenedor real ni la atribución de un clic real.

Antes del lanzamiento: revisar y autorizar el PR; registrar el ID real de campaña una vez exista; publicar solo con aprobación; comprobar en Tag Assistant/GA4 los parámetros efectivamente enviados, ausencia de datos excluidos, una etiqueta principal por carga y un registro por acción. Vincular la cuenta Ads correcta y revisar conversiones sin duplicar importaciones. El presupuesto final en MXN y el lanzamiento requieren aprobación separada.

## Fuentes oficiales

- [Parámetros de configuración GA4](https://developers.google.com/analytics/devguides/collection/ga4/reference/config).
- [Fuentes de tráfico y atribución](https://support.google.com/analytics/answer/15612152?hl=en).
- [Identificadores agregados y redirecciones](https://support.google.com/analytics/answer/16479993?hl=en).
- [Consent Mode](https://developers.google.com/tag-platform/security/guides/consent).
