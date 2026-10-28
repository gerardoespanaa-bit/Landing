# Privacidad y medición con consentimiento avanzado

Actualizado para el PR #23 el 28 de octubre de 2026. Rama en borrador, sin merge, publicación ni cambios en Google Ads. Las instrucciones históricas de instalación se conservan como referencia; no deben repetirse.

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
- Se conserva Consent Mode avanzado: antes de elegir o al rechazar pueden enviarse señales limitadas sin cookies opcionales. analytics_storage sigue Analítica; ad_storage y ad_user_data siguen Medición publicitaria. ad_personalization permanece denied. allow_google_signals y allow_ad_personalization_signals continúan en false.
- Clave landing-privacy-consent-v3: dos booleanos, versión del aviso y fecha; validez máxima 180 días, caducidad y sincronización entre pestañas. La clave anterior v2 solo puede restaurar su permiso analítico, nunca publicidad. Un registro inválido no concede nada. Sin almacenamiento, la elección dura la página actual.
- Las elecciones no recargan, no inician otro contenedor ni reproducen interacciones. Revocar actualiza los cuatro estados y elimina, cuando son accesibles, cookies _ga del uso analítico rechazado y _gcl_/_gac_ y _gcl_ls del uso publicitario rechazado. No elimina datos históricos ni cookies de otros dominios.
- El aviso y el panel de preferencias describen este tratamiento. La revisión del PR incluye esa actualización antes de publicarla. No constituye una revisión jurídica externa.

## Eventos y datos permitidos

| Evento | Momento | Servicio | Ubicación |
|---|---|---|---|
| simulator_open | Al abrir realmente el simulador | retiro | header, hero o footer |
| simulator_complete | Al finalizar un cálculo válido y su animación | retiro | simulator |
| whatsapp_contact | Al continuar a WhatsApp o pulsar un enlace social directo | general, retiro, seguros, bolsa o auto | Ubicación original del botón |

Parámetros de negocio desde vocabulario cerrado: service, button_location, button_id y action_type cuando corresponda. ui_click cubre interacciones informativas útiles. No se añaden valores del formulario, datos financieros, teléfonos, correos, mensajes ni URLs de WhatsApp. La función de eventos y sus listas permitidas permanecen idénticas.

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
2. En una URL de prueba con este PR, conectar Tag Assistant. Comprobar las seis rutas de la tabla siguiente, una sola carga de GTM y una etiqueta principal. No usar el sitio publicado anterior como evidencia de este PR ni publicar para probar sin autorización.
3. En Analytics, verificar que Medición mejorada sigue desactivada. En Network/collect revisar que no aparecen link_url, teléfono, mensaje, valores del simulador, parámetros arbitrarios ni fragmentos en dl; solo los identificadores admitidos y el vocabulario UTM cerrado. En dr solo puede aparecer el origen de un dominio conocido, sin ruta ni consulta. Las peticiones técnicas inevitablemente revelan información de conexión al proveedor; no se afirma anonimato absoluto.
4. Probar los tres eventos y todas las ubicaciones, rechazar/aceptar/retirar, doble clic, entradas inválidas, recálculo, cancelación y resize. Un page_view por carga; aceptar/rechazar no debe añadir otro. En modo avanzado pueden existir señales sin cookies con denied: no exigir cero tráfico.
5. En GA4 DebugView comprobar los eventos **con analítica aceptada** y una sesión con debug_mode=true solo en vista previa. Con analytics_storage denegado Google puede no mostrarlos en DebugView; usar Tag Assistant y la red para ese estado. No confundir ausencia en DebugView con ausencia de solicitudes.
6. La auditoría terminó con cero cambios pendientes en GTM. Esta corrección del sitio no exige publicar otra versión del contenedor. Publicar la landing únicamente tras aprobar el PR; después salir de vista previa y no dejar depuración permanente.

**Estado de evidencia del PR #23 actualizado:** 124 casos offline aprobados: 23 de arranque/almacenamiento, 15 de interfaz y 86 de atribución/privacidad. No equivalen a prueba de navegador ni de Tag Assistant. Escritorio, móvil, estados aplicados por el contenedor real y recepción del nuevo flujo en GA4 están pendientes: no existe una vista HTTPS de pruebas y el navegador no accede a la vista local. Google Ads, GTM publicado y GA4 no se han modificado.

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


## Dos pantallas y estados esperados

El primer Ok acepta las dos finalidades informadas. Aquí solo abre el panel. Los interruptores se restauran desde una decisión válida, o empiezan apagados sin ella. En el panel Ok guarda los interruptores y Solo esenciales guarda ambos en false. Cerrar o Escape descarta cambios sin aceptar. Los botones del panel están fuera de su zona desplazable. El enlace permanente se llama Preferencias de privacidad.

| Recorrido | analytics_storage | ad_storage | ad_user_data | ad_personalization |
|---|---|---|---|---|
| Sin decisión | denied | denied | denied | denied |
| Ok inicial | granted | granted | granted | denied |
| Solo esenciales | denied | denied | denied | denied |
| Solo analítica | granted | denied | denied | denied |
| Analítica y medición publicitaria | granted | granted | granted | denied |
| Solo medición publicitaria | denied | granted | granted | denied |
| Revocación total | denied | denied | denied | denied |

Ejecutar todos los recorridos en escritorio y móvil. En Tag Assistant comprobar la pestaña Consentimiento después del comando y en el siguiente evento, no solo el dataLayer. Verificar persistencia, cambio parcial, revocación, ausencia de remarketing, una etiqueta principal y que el evento siguiente respete los estados. No generar clics de anuncios, mensajes o citas de prueba. El test de integración de navegador queda adaptado pero no se ejecutó en esta revisión.

## Observaciones jurídicas delimitadas

La LFPDPPP mexicana exige consentimiento libre, específico e informado y revocación; sus artículos 14–16 regulan los avisos. Se añade identificación, acceso directo al aviso integral y en el panel domicilio, datos y finalidades. No se identificó en esos artículos una regla literal de rechazo en la primera capa; eso no certifica la validez de cualquier diseño. [Texto oficial](https://www.ordenjuridico.gob.mx/Documentos/Federal/html/wo125102.html).

Si resultan aplicables reglas europeas, una primera capa con aceptación sin rechazo equivalente presenta una incompatibilidad concreta con el criterio mayoritario de las autoridades del EDPB. Requeriría adaptación antes de tratar ese tráfico bajo esas reglas. No se introduce aquí geolocalización ni se presume que segmentar anuncios a México excluya todas las visitas extranjeras. [EDPB, apartados 3 y 5](https://www.edpb.europa.eu/system/files/2023-01/edpb_20230118_report_cookie_banner_taskforce_en.pdf), [ámbito de la política de Google](https://www.google.com/about/company/user-consent-policy/).

El registro local de preferencias no constituye una bitácora central ni una certificación jurídica. Consent Mode no sustituye la base válida para las señales técnicas anteriores a la elección. La aceptación de medición no autoriza evaluaciones financieras, envío de datos de contacto, conversiones mejoradas ni nuevas integraciones. [Implementación y revocación](https://developers.google.com/tag-platform/security/guides/consent).

