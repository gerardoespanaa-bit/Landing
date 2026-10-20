# Instalación inicial de Google Tag Manager (registro del PR #8)

Actualización del 20 de octubre de 2026: este documento conserva el alcance histórico de la instalación inicial. La rama actual elimina la restricción temporal, unifica el cargador y conecta consentimiento avanzado. Para el estado actual, configuración privada y pruebas pendientes, seguir [PRIVACIDAD-Y-MEDICION.md](PRIVACIDAD-Y-MEDICION.md); no volver a introducir la lista vacía o el cargador alternativo descritos aquí.

Alcance de esta propuesta: instalar el contenedor **GTM-KMG6BPKF** en la landing actual, sin configurar GA4, eventos, conversiones ni campañas. El ID **G-VSNRQ7H8JL**, proporcionado por el propietario, queda reservado para una configuración posterior dentro de GTM. No se añade `gtag.js` ni una llamada de configuración de GA4.

## Fragmentos y duplicados

`index.html` incluye una única copia del script oficial en `<head>`, después de la codificación y de la configuración preventiva de consentimiento. El fragmento oficial `<noscript>` es el primer elemento después de abrir `<body>`. Ambos utilizan el mismo ID real. No hay inyección adicional mediante un archivo externo.

La instalación original del PR #8 partió de un `main` sin GA4 ni GTM. Los PR #7 y #8 ya están fusionados: existe el cargador oficial y permanece desactivado el cargador alternativo preparatorio. **No operar ambos cargadores** al activar analítica; antes hay que unificarlos. El aviso se actualiza por separado en el PR #9.

Referencia de los dos fragmentos: [instalación oficial del contenedor web](https://support.google.com/tagmanager/answer/14847097?hl=en).

## Privacidad y consentimiento: medición pendiente

Antes del script se inicializa la capa de datos y se establecen `analytics_storage`, `ad_storage`, `ad_user_data` y `ad_personalization` como `denied`. Además, la lista de tipos autorizados `gtm.allowlist` se deja vacía para restringir la ejecución de etiquetas mientras se revisan el aviso y el consentimiento. El contenedor se descarga y se inicializa; esto no equivale a activar GA4 o publicidad.

No se agrega un botón de aceptación ni se concede consentimiento automáticamente. No se debe retirar esta restricción para intentar hacer funcionar Analytics antes de completar la revisión. El estado denegado por sí solo no garantiza ausencia de envíos: algunas etiquetas pueden realizar pings sin cookies; por eso se mantiene también la restricción de etiquetas.

**Límite del fragmento sin JavaScript:** el iframe oficial no ejecuta la configuración JavaScript de consentimiento ni la lista local. En la verificación, la versión pública 1 del contenedor tenía cero etiquetas, reglas y predicados, y su respuesta sin JavaScript no produjo solicitudes de medición. Antes de publicar etiquetas en el contenedor, debe revisarse expresamente esta ruta: no habilitar píxeles o etiquetas que puedan ejecutarse sin JavaScript sin un mecanismo de consentimiento adecuado. Esta entrega no modifica ni publica la configuración de la cuenta GTM.

Cargar GTM hace una solicitud técnica a Google incluso sin medición activa. El aviso definitivo debe reflejar los proveedores y prácticas reales. El aviso actualizado y las confirmaciones del propietario se incorporan al PR #9. Su publicación no activa analítica ni cambia esta restricción.

Referencias: [configuración de consentimiento](https://developers.google.com/tag-platform/security/guides/consent) y [restricción de tipos de etiquetas](https://developers.google.com/tag-platform/tag-manager/restrict). Google recomienda plantillas y políticas para una gestión más completa; esta restricción temporal no sustituye una solución de consentimiento.

## Verificación antes de publicar la landing

- Revisar el PR y autorizar su incorporación a `main`; no se ha publicado automáticamente.
- Confirmar una sola solicitud a `gtm.js?id=GTM-KMG6BPKF`, respuesta 200 y objeto `google_tag_manager['GTM-KMG6BPKF']` inicializado.
- Confirmar el iframe de respaldo con JavaScript desactivado y ausencia de solicitudes de Analytics/Ads en la versión vacía del contenedor.
- Mantener los cálculos y los enlaces de WhatsApp. No enviar mensajes de prueba.

La comprobación del contenedor se realiza en una vista local con acceso al script real de Google. La página pública de GitHub Pages seguirá sin estos cambios hasta que el propietario apruebe y fusione el PR.

Resultado del 19 de octubre de 2026: Chrome cargó el contenedor real una sola vez por página y el respaldo sin JavaScript obtuvo respuesta 200. Se probaron escritorio de 1366 × 768 y anchos de 320, 390 y 768 píxeles, los cinco escenarios financieros existentes, nueve botones de contacto y dos enlaces sociales. No hubo errores JavaScript, desbordamiento horizontal ni solicitudes de Analytics/Ads. Las pruebas locales del motor y de la referencia fiscal también pasaron. `app.js`, `engine.js`, `projection-metrics.js`, `updates.css` y el HTML fuera de los bloques añadidos permanecen idénticos a `main`.

Para una fase posterior a la actualización del aviso: configurar una solución de consentimiento analítico, adaptar el cargador preparatorio del PR #7 sin duplicar el oficial, configurar GA4 únicamente desde GTM y comprobar consentimiento y eventos con Tag Assistant y DebugView. Aprobar el procedimiento de prospectos no otorga consentimiento analítico a los visitantes ni activa esa fase.
