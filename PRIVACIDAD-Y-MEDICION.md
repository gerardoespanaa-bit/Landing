# Privacidad y medición con consentimiento avanzado

Cambios preparados el 20 de octubre de 2026 en una rama para revisión. No se publica el sitio ni el contenedor desde esta tarea.

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

## Instalación unificada y modo avanzado

- Contenedor real **GTM-KMG6BPKF**; flujo de Analytics **G-VSNRQ7H8JL**. No se añaden identificadores nuevos ni una instalación directa de gtag.js.
- En ambas páginas, el primer comando establece los cuatro consentimientos como denegados. Después se ejecutan de forma síncrona la configuración y el arranque de preferencias, antes del único fragmento de GTM.
- Se elimina la lista vacía que bloqueaba etiquetas y el antiguo cargador alternativo. Si el arranque está deshabilitado, es inválido o no carga, el script de GTM no arranca. El iframe oficial noscript se conserva como primer contenido del body; no ejecuta las etiquetas JavaScript de GA4. No configurar etiquetas de imagen/Custom HTML que eludan el consentimiento en esa ruta.
- Modo avanzado elegido por el propietario: se carga GTM y puede ejecutarse GA4 antes de aceptar y después de rechazar; Google puede recibir señales limitadas sin cookies analíticas. El rechazo no promete ausencia total de solicitudes. Las preferencias actualizan analytics_storage; ad_storage, ad_user_data y ad_personalization siempre siguen denegados.
- Elección local de hasta 180 días, validación de caducidad y sincronización entre pestañas. Se usa una clave v2 para solicitar una nueva elección bajo este modo. Si el almacenamiento está bloqueado, la elección se aplica durante la página actual y se vuelve a pedir en una visita posterior.
- Aceptar o rechazar no recarga, no inicia otro contenedor, no vuelve a ejecutar el page_view y no reproduce interacciones anteriores. Al retirar aceptación se intenta borrar las cookies _ga accesibles en el dominio/ruta. No se borran datos históricos de Google.
- El aviso y el panel de preferencias describen este tratamiento. La revisión del PR incluye esa actualización antes de publicarla. No constituye una revisión jurídica externa.

## Eventos y datos permitidos

| Evento | Momento | Servicio | Ubicación |
|---|---|---|---|
| simulator_open | Al abrir realmente el simulador | retiro | header, hero o footer |
| simulator_complete | Al finalizar un cálculo válido y su animación | retiro | simulator |
| whatsapp_contact | Al continuar a WhatsApp o pulsar un enlace social directo | general, retiro, seguros, bolsa o auto | Ubicación original del botón |

Únicos parámetros de negocio: **service** y **button_location**, desde listas cerradas. Las otras ubicaciones permitidas son services, about, cta_band y floating. No hay edades, ingresos, importes, saldos, teléfonos, mensajes, URLs de WhatsApp ni datos del formulario en los eventos propios. Las interacciones también se entregan al contenedor con consentimiento denegado; sus etiquetas de Google deben aplicar ese estado, sin conceder permisos por medir un clic.

Abrir el diálogo de contacto no es una conversión. Doble clic en el mismo enlace dentro de 800 ms cuenta una vez; cálculo inválido, animación cancelada y redimensionado no producen finalizaciones. Una nueva proyección completada sí cuenta. Un clic de WhatsApp no confirma mensaje, cita ni venta.

El arranque publica parámetros saneados antes de GTM y los establece también como valores globales: page_location canónica con una lista cerrada de parámetros y valores de campaña, page_referrer limitado al origen de dominios conocidos y título fijo. No se emite el antiguo landing_page_view: **la etiqueta principal genera el único page_view**. No crear en paralelo una etiqueta manual de page_view. [ATRIBUCION-SEGURA.md](ATRIBUCION-SEGURA.md) detalla formatos, vocabulario, referentes admitidos, pruebas y límites. Esto prepara una corrección; no demuestra atribución Ads real ni autoriza publicarla.

## Configurar Google antes de publicar el contenedor

La auditoría del 20/10/2026 comprobó las dos etiquetas existentes y la recepción de los tres eventos en GA4 en un recorrido controlado de la versión publicada. La corrección de atribución reutiliza esa configuración: **no crear etiquetas, activadores ni instalaciones adicionales**. Esta rama no modifica GTM ni Google Analytics. Las instrucciones siguientes se conservan como referencia de la instalación; no son una solicitud para duplicarla.

1. **Primero, en GA4**, Administrar → Flujos de datos → Landing PPR: desactivar **Medición mejorada**, en especial clics salientes, formularios, búsqueda, descargas y cambios de historial. Un clic saliente automático puede mandar link_url con teléfono y mensaje. Desactivar también datos proporcionados por usuarios/User-ID y no habilitar Google Signals o personalización publicitaria. Si la etiqueta nueva ofrece detección automática de eventos, mantenerla desactivada. Es requisito antes de Enviar; no basta con que el código local omita esos datos.
2. En GTM crear variables de capa de datos **versión 2** para page_location, page_referrer, page_title, service y button_location (ejemplo de nombre: DLV - page_location). No usar Click URL, Form Element, texto de botones ni variables del DOM como parámetros.
3. **Editar la etiqueta existente GA4 - Etiqueta principal; no crear otra.** ID G-VSNRQ7H8JL, Initialization – All Pages, una vez por página, sin excepciones ni consentimiento adicional. Sus comprobaciones integradas respetan Consent Mode. Añadir en configuración page_location={{DLV - page_location}}, page_referrer={{DLV - page_referrer}}, page_title={{DLV - page_title}}, allow_google_signals=false, allow_ad_personalization_signals=false. Mantener el envío automático inicial de page_view (send_page_view=true si se define explícitamente). No añadir User-ID, user_data, identificadores de usuario, formularios o parámetros de WhatsApp.
4. Para los tres eventos propios, crear **una** etiqueta Google Analytics: evento de GA4 con ID G-VSNRQ7H8JL, nombre de evento {{Event}} y activador de evento personalizado con expresión regular exacta **^(simulator_open|simulator_complete|whatsapp_contact)$**. Parámetros: service={{DLV - service}}, button_location={{DLV - button_location}} y los tres parámetros saneados de página. Una vez por evento y sin consentimiento adicional; no añadir un activador genérico de clics en paralelo. Si ya existe una etiqueta equivalente, editarla.
5. Registrar service y button_location como dimensiones de evento para informes si se necesitan. No crear a la vez otra etiqueta de conversión Ads para la misma acción ni importar la misma conversión dos veces. Vincular Ads y definir conversiones queda para una fase posterior.

## Validación antes de Enviar

1. Revisar el PR y desplegar el sitio solo mediante el merge aprobado por el propietario. El CNAME y el dominio comprado se conservan. Si se dispone de una vista de prueba accesible, se puede revisar antes del merge. El servidor local también sirve para GTM Preview.
2. Abrir Vista previa de GTM contra https://xn--gerardoespaa-khb.com/ (tras desplegar) o el servidor de prueba. Confirmar una sola carga del contenedor y la etiqueta principal ejecutada. Inspeccionar Consentimiento: por defecto cuatro estados denied. Aceptar debe cambiar solo analytics_storage a granted; rechazar o retirar lo devuelve a denied. Volver a visitar y comprobar la preferencia.
3. En Analytics, verificar que Medición mejorada sigue desactivada. En Network/collect revisar que no aparecen link_url, teléfono, mensaje, valores del simulador, parámetros arbitrarios ni fragmentos en dl; solo los identificadores admitidos y el vocabulario UTM cerrado. En dr solo puede aparecer el origen de un dominio conocido, sin ruta ni consulta. Las peticiones técnicas inevitablemente revelan información de conexión al proveedor; no se afirma anonimato absoluto.
4. Probar los tres eventos y todas las ubicaciones, rechazar/aceptar/retirar, doble clic, entradas inválidas, recálculo, cancelación y resize. Un page_view por carga; aceptar/rechazar no debe añadir otro. En modo avanzado pueden existir señales sin cookies con denied: no exigir cero tráfico.
5. En GA4 DebugView comprobar los eventos **con analítica aceptada** y una sesión con debug_mode=true solo en vista previa. Con analytics_storage denegado Google puede no mostrarlos en DebugView; usar Tag Assistant y la red para ese estado. No confundir ausencia en DebugView con ausencia de solicitudes.
6. La auditoría terminó con cero cambios pendientes en GTM. Esta corrección del sitio no exige publicar otra versión del contenedor. Publicar la landing únicamente tras aprobar el PR; después salir de vista previa y no dejar depuración permanente.

**Estado de evidencia:** la auditoría de la versión publicada verificó recepción de los tres eventos en Tag Assistant y GA4, una vez por acción probada. Las pruebas de la corrección de esta rama son locales y no acreditan entrega del código nuevo a GA4 ni atribución de clics reales. La validación en producción queda pendiente de revisión, publicación autorizada y acceso/vinculación a Ads. No sustituir estas limitaciones por el resultado de la auditoría anterior.

## Pruebas reproducibles

- node test-consent-init.cjs: preferencias inválidas/caducadas/futuras, almacenamiento bloqueado, rutas, idempotencia y cambios entre pestañas.
- node test-attribution.cjs: URLs de campaña, datos personales sintéticos, duplicados, referentes, consentimiento y arranque único, sin red.
- node test.cjs y node test-metrics.cjs: cálculos y referencia fiscal existentes.
- node test-measurement.cjs: integración en Chrome con Playwright, contenedor interceptado, consentimiento, eventos, todos los contactos, cinco escenarios, móvil, animación y datos excluidos. Configurar PLAYWRIGHT_MODULE y CHROME_PATH si esos programas no están en las rutas predeterminadas; QA_OUTPUT guarda evidencia.

Fuentes: [Consent Mode avanzado y orden de arranque](https://developers.google.com/tag-platform/security/guides/consent?consentmode=advanced), [comprobaciones integradas y etiquetas bloqueadas](https://support.google.com/analytics/answer/12962079?hl=es), [medición mejorada y link_url](https://support.google.com/analytics/answer/9216061?hl=es), [parámetros de página](https://developers.google.com/analytics/devguides/collection/ga4/reference/config), [vista previa](https://support.google.com/tagmanager/answer/6107056?hl=es), [DebugView](https://support.google.com/analytics/answer/7201382?hl=es).

## Supuestos financieros pendientes, fuera del alcance de este cambio

- Comisiones, IVA, UDI fija de $8.81, bono y su elegibilidad, y continuación de aportaciones después de 25 años: contrastar con contrato vigente.
- Rendimiento ilustrativo del 10% bruto y ausencia de inflación: son supuestos, no rendimientos prometidos.
- Referencia fiscal al 25%, límites por UMA e ingresos, elegibilidad y posible devolución: revisar situación fiscal y año aplicable.
- Escenario «Libre de impuestos»: verificar modalidad, requisitos y límites de retiro. El motor no calcula ISR personal y la interfaz muestra `saldoTotal`.

Se conserva el cálculo existente. «1 año» ya estaba corregido y se conserva.

