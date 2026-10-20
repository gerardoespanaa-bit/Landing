# Preparación de privacidad y medición

Estado actual: los fragmentos oficiales de GTM están publicados y GA4 sigue sin activarse. El PR #9 contiene el aviso actualizado con el CRM en Lovable, contratación mediante Allianz DAF y procedimiento y criterio de conservación confirmados por el propietario. El merge publicará el aviso sin marcas de borrador; no activa medición. El seguimiento operativo está en [REVISION-PRIVACIDAD.md](REVISION-PRIVACIDAD.md).

## Datos y procedimiento confirmados

| Dato | Confirmación |
|---|---|
| Responsable | Gerardo López España, persona física; nombre profesional Gerardo España |
| Domicilio | Plaza Nazas, Av. Fray Luis de León 7092, Local 27B, Colinas del Cimatario, C. P. 76090, Santiago de Querétaro, Querétaro, México |
| Correo | gerardoespanaa@gmail.com |
| Finalidades | Contacto, cita, evaluación y propuesta solicitada; si el cliente decide contratar, gestión de la formalización con Allianz |
| Evaluación | Edad, ocupación, ingresos aproximados, capacidad de ahorro, aportación mensual deseada, retiro objetivo y objetivos financieros, según el caso |
| CRM | Propio, alojado en Lovable |
| Contratación | Gestionada por el asesor con el cliente mediante Allianz DAF |
| Destinataria de contratación | Allianz México, S.A., Compañía de Seguros |
| Publicidad | No se enviará inicialmente |
| Conservación sin contratación | 12 meses desde el último contacto, según criterio aprobado por el propietario y obligaciones de conservación o bloqueo aplicables |
| ARCO y revocación | Procedimiento por correo confirmado por el propietario; no se ofrece automatización ni portal |

La rama no modifica el CRM ni valida técnicamente su borrado, respaldos o controles de acceso. La aprobación del procedimiento no se presenta como una automatización implementada. Las tres etapas quedan diferenciadas y los avisos de Allianz no se sustituyen por el del asesor.

## IDs reales recibidos y estado técnico

No se requieren contraseñas. El propietario ya proporcionó:

1. Contenedor **GTM-KMG6BPKF**: instalado mediante los fragmentos oficiales de `index.html`.
2. Medición **G-VSNRQ7H8JL**: reservada para configuración posterior dentro de GTM, sin instalación directa de GA4.

El archivo preparatorio `measurement-config.js` conserva campos vacíos, `enabled:false` y `privacyApproved:false`. Esto mantiene desactivado su flujo de eventos; no impide la carga oficial de GTM desde el HTML. No cambiar esos valores sin adaptar el cargador alternativo para evitar duplicados y resolver la restricción de etiquetas y el consentimiento. Los apartados técnicos siguientes son una guía pendiente de adaptar y validar, no una instalación activa ni un mecanismo de elección ya implementado.

## Eventos y reglas de conteo

| Evento de dataLayer/GA4 | Cuándo ocurre | Servicio | Ubicación |
|---|---|---|---|
| `simulator_open` | Al abrir realmente el simulador | `retiro` | `header`, `hero` o `footer` |
| `simulator_complete` | Al terminar la animación de un cálculo válido | `retiro` | `simulator` |
| `whatsapp_contact` | Al pulsar Continuar o un enlace social directo | `general`, `retiro`, `seguros`, `bolsa` o `auto` | Ubicación original del botón |

Parámetros de negocio permitidos: **solo** `service` y `button_location`. Ubicaciones adicionales: `services`, `about`, `cta_band`, `floating`. Las etiquetas proceden de listas cerradas; no se derivan del texto del botón, mensaje, teléfono o URL. La visita utiliza `landing_page_view` como disparador interno para un único `page_view`, con ubicación canónica sin consulta ni fragmento y referente vacío.

Abrir el diálogo de contacto no cuenta como clic a WhatsApp. El enlace deshabilitado de seguros no cuenta. Un doble clic al mismo enlace dentro de 800 ms cuenta una vez. Un cálculo inválido o interrumpido no cuenta; recalcular y completar otro cálculo sí representa otra interacción. No se usa un activador genérico de clics en paralelo. Un clic de WhatsApp no acredita que se envió un mensaje, hubo una cita o una venta.

## Configuración requerida dentro de GTM y GA4

El código del repositorio no puede configurar una propiedad o un contenedor de una cuenta de Google. Completar estas instrucciones en el contenedor real **antes de activarlo en el sitio**:

1. Crear variables de capa de datos (versión 2) para `measurement_id`, `page_location`, `page_referrer`, `page_title`, `service` y `button_location`. Los cuatro primeros se establecen antes del arranque del contenedor.
2. Crear **una sola etiqueta de Google**, con ID `{{DLV measurement_id}}`, activador **Initialization – All Pages**, una vez por página. Parámetros de configuración: `send_page_view:false`, `page_location:{{DLV page_location}}`, `page_referrer:{{DLV page_referrer}}`, `page_title:{{DLV page_title}}`, `allow_google_signals:false`, `allow_ad_personalization_signals:false`. No añadir otra instalación directa `gtag.js`.
3. Crear una etiqueta GA4 de evento con nombre `page_view`, ID `{{DLV measurement_id}}`, activador personalizado **exacto** `landing_page_view`. Incluir explícitamente los tres parámetros de página anteriores. Una activación por evento.
4. Crear una etiqueta GA4 de evento con nombre `{{Event}}`, ID `{{DLV measurement_id}}`, activador personalizado con expresión regular **`^(simulator_open|simulator_complete|whatsapp_contact)$`**. Incluir únicamente `service`, `button_location` y los tres parámetros de página saneados. Una activación por evento. No capturar valores de formularios o del DOM.
5. En GA4, desactivar la medición mejorada automática del flujo para esta implementación, incluidos clics salientes, formularios y cambios de historial. Desactivar también recopilación de datos proporcionados por usuarios, User-ID, Google Signals y funciones publicitarias. No crear etiquetas de captura automática, Custom HTML, Ads o conversiones mejoradas en este contenedor sin otra revisión. Revisar que no existan configuraciones heredadas que vuelvan a capturar URLs o campos.
6. Registrar `service` y `button_location` como dimensiones personalizadas de evento si se usarán en informes. Si se elige `whatsapp_contact` como evento clave, documentar que representa intención de contacto, no un lead confirmado.

La medición automática de enlaces podría capturar `link_url` con el mensaje editable de WhatsApp; por eso debe permanecer desactivada. La API local descarta eventos o valores fuera de las listas permitidas y no incluye edades, importes, saldos, teléfono, mensajes, `link_url`, consulta de URL ni referente. La configuración externa del contenedor también debe respetar estas restricciones.

Fuentes: [etiqueta de Google mediante GTM](https://support.google.com/tagmanager/answer/14842872?hl=en), [medición mejorada](https://support.google.com/analytics/answer/9216061?hl=es), [parámetros de configuración](https://developers.google.com/analytics/devguides/collection/ga4/reference/config) y [evitar información identificable](https://support.google.com/analytics/answer/6366371?hl=es).

## Consentimiento y activación controlada

Con los IDs ya recibidos, falta aprobar el aviso y adaptar conjuntamente el cargador, las restricciones y la configuración del contenedor. No basta con completar `measurement-config.js` o cambiar sus indicadores a `true`: eso puede combinar dos cargadores. La activación requiere otra revisión técnica y operativa. No usar IDs de pruebas en producción.

El comportamiento del prototipo que se describe a continuación está desactivado y requiere adaptación antes de usarse. No acredita que se haya implementado un mecanismo operativo de consentimiento.

El panel analítico se muestra únicamente cuando la configuración está completa. Aceptar habilita `analytics_storage`; `ad_storage`, `ad_user_data` y `ad_personalization` permanecen denegados. Rechazar mantiene bloqueado el contenedor completo, sin pings de medición. El consentimiento es básico: GTM no se carga antes de aceptar. Se omite intencionalmente el iframe `noscript` para no cargar medición saltándose la elección del usuario.

La preferencia local dura hasta 180 días. «Preferencias de medición» permite revisarla desde el pie y desde el aviso; al revocar se actualiza el estado, se intenta borrar las cookies `_ga` accesibles del sitio y se recarga para retirar las etiquetas ya cargadas. La revocación no borra datos históricos en Google. No se implementa atribución o seguimiento publicitario de Google Ads; requeriría definir consentimientos y configuración en otra revisión.

Referencia: [modo de consentimiento](https://developers.google.com/tag-platform/security/guides/consent).

## Verificación final con IDs reales: pendiente

**No realizada en Tag Assistant ni en GA4 DebugView:** los IDs ya están confirmados, pero falta la configuración de cuentas, integración unificada y consentimiento. Las pruebas de eventos del PR #7 usaron un contenedor simulado e interceptado. El PR #8 verificó la carga real del contenedor vacío. Ninguna prueba sustituye la validación final de GA4 y sus eventos.

1. Con el aviso aprobado e IDs reales en una vista de prueba, abrir GTM → Vista previa y conectar Tag Assistant a esa vista. No publicar en `main` para hacer la prueba. Puede utilizarse un servidor local accesible en el navegador de la sesión de vista previa.
2. En un navegador limpio, antes de aceptar y tras rechazar, confirmar cero cargas de GTM y Analytics. Aceptar y confirmar una sola carga de contenedor y un único `page_view`. Revisar estado de consentimiento analítico concedido y publicitario denegado.
3. Abrir el simulador desde cada ubicación, intentar una entrada inválida, completar un cálculo, cambiar el tamaño de pantalla, recalcular y cancelar una animación. Verificar una emisión por interacción completada y ninguna al redibujar o cancelar.
4. Abrir cada diálogo de contacto: cero `whatsapp_contact`. Seleccionar seguros y continuar: uno. Probar doble clic y ambos enlaces sociales sin enviar mensajes. Verificar servicio y ubicación correctos.
5. Habilitar depuración de GA4 únicamente en la sesión de prueba, por ejemplo con `debug_mode:true` en una configuración de vista previa no publicada. En DebugView comprobar nombres, conteos y parámetros. Inspeccionar además las solicitudes `collect`: ni el mensaje de prueba ni el teléfono ni `wa.me` deben aparecer. Revisar `page_location` sin consulta/fragmento y `page_referrer` vacío, y ausencia de valores del simulador.
6. Revocar aceptación y comprobar que cesa la medición tras recarga, sin perder el uso del simulador ni contacto. Repetir en móvil y revisar navegación al aviso y regreso. Salir de la depuración y retirar cualquier ajuste de prueba antes de publicar el contenedor.

Guardar evidencia de Tag Assistant y DebugView con fecha, contenedor/versión y resultado; no marcar la verificación como completa sin ella. Fuentes: [Tag Assistant y vista previa](https://support.google.com/tagmanager/answer/6107056?hl=es) y [GA4 DebugView](https://support.google.com/analytics/answer/7201382?hl=es).

## Supuestos financieros pendientes, fuera del alcance de este cambio

- Comisiones, IVA, UDI fija de $8.81, bono y su elegibilidad, y continuación de aportaciones después de 25 años: contrastar con contrato vigente.
- Rendimiento ilustrativo del 10% bruto y ausencia de inflación: son supuestos, no rendimientos prometidos.
- Referencia fiscal al 25%, límites por UMA e ingresos, elegibilidad y posible devolución: revisar situación fiscal y año aplicable.
- Escenario «Libre de impuestos»: verificar modalidad, requisitos y límites de retiro. El motor no calcula ISR personal y la interfaz muestra `saldoTotal`.

Se conserva el cálculo existente. El único cambio del resultado es gramatical: «1 año».
