# Interacciones informativas y origen de WhatsApp

Este cambio está preparado para revisión. No publicar el contenedor de GTM ni fusionar el PR sin aprobación. No modifica consentimiento, atribución, cálculos, proyecciones, estilos ni disposición del simulador.

## Contrato de eventos

Se conservan `simulator_open`, `simulator_complete` y `whatsapp_contact`. `ui_click` describe exclusivamente interacciones informativas y no debe marcarse como evento clave de GA4 ni importarse como conversión de Google Ads.

Todos los eventos envían `service` y `button_location`. Añaden `button_id` y `action_type` con valores estáticos permitidos; los campos que no corresponden se envían como `null` para limpiar el modelo de datos de GTM y evitar arrastrar valores anteriores. No se envían texto del botón, URLs completas, campos, mensajes, edades, aportaciones, necesidades de seguros ni resultados financieros.

| button_id | service | button_location | Uso comercial |
|---|---|---|---|
| wa_header_social | general | header | Nivel 3 |
| wa_header_advisory | general | header | Nivel 3 |
| wa_hero_advisory | general | hero | Nivel 3 |
| wa_simulator_results | retiro | simulator | Nivel 4a |
| wa_retirement_card | retiro | services | Nivel 4b |
| wa_insurance_card | seguros | services | Otro servicio |
| wa_investments_card | bolsa | services | Otro servicio |
| wa_auto_card | auto | services | Otro servicio |
| wa_about_social | general | about | Nivel 3 |
| wa_cta_advisory | general | cta_band | Nivel 3 |
| wa_floating | general | floating | Nivel 3 |

Nivel 1 = apertura; nivel 2 = cálculo completado. Los niveles son hipótesis no secuenciales; un clic a WhatsApp no demuestra mensaje recibido, prospecto calificado, cita o contrato. La tarjeta de retiro no prueba que el visitante haya calculado una proyección personal.

La apertura del diálogo se registra como `ui_click/open_contact`; su salida real conserva un único `whatsapp_contact`. Cerrar el diálogo se distingue con `close_contact`, sin asumir abandono. No se añade `ui_click` a la apertura del simulador, al cálculo terminado ni a la salida de WhatsApp. Se conserva la supresión de doble clic de 800 ms para WhatsApp; volver a abrir el diálogo inicia una acción nueva.

Otras interacciones permitidas: navegación de secciones, enlaces sociales estáticos, menú móvil, detalles de proyección, selección de credenciales y apertura/cierre de sus documentos. No se registran cambios de valores del simulador o del mensaje ni decisiones de consentimiento como señales comerciales.

## Preparación de GTM, sin publicar

Contenedor GTM-KMG6BPKF. Reutilizar la etiqueta 12 `GA4 - Eventos simulador y WhatsApp`, con nombre de evento `{{Event}}`, destino G-VSNRQ7H8JL y sus parámetros y comprobaciones de consentimiento actuales.

1. Dos variables de capa de datos, versión 2: `DLV - button_id` → `button_id`; `DLV - action_type` → `action_type`. Sin valores por defecto, sin leer campos o elementos del DOM.
2. Añadir esas dos variables como parámetros `button_id` y `action_type` de la etiqueta existente.
3. Ampliar el activador 11 existente a `^(simulator_open|simulator_complete|whatsapp_contact|ui_click)$`. Mantener una activación por evento.
4. No crear otra instalación, etiqueta principal o activador por botón. No tocar la etiqueta principal ni otorgar consentimiento publicitario.
5. Antes de publicar, comprobar los tres eventos y los campos nuevos en Vista previa. La publicación de GTM y el despliegue de la landing son aprobaciones distintas del lanzamiento de Ads.

La exploración inicial utiliza las dimensiones existentes `service` y `button_location`. Registrar `button_id` y `action_type` como dimensiones de evento cuando el cambio esté autorizado y vaya a validarse; los nuevos clics se incorporarán al informe solo después de publicación y validación. Las dimensiones no recuperan valores que nunca se recopilaron.

## Validación

- `node test-ui-measurement.cjs`: registro de controles, rechazo de identificadores/acciones arbitrarios, ausencia de datos sintéticos en payloads, limpieza de campos e inicialización idempotente. En una copia con carpeta de referencia también compara estilos, motor y HTML.
- `node test-attribution.cjs`: 86 comprobaciones de filtrado de URL/referrer y consentimiento; los casos de los eventos se adaptan al nuevo identificador obligatorio de WhatsApp.
- `node test-consent-init.cjs`, `node test.cjs`, `node test-metrics.cjs`: consentimiento y cálculos existentes.
- `test-measurement.cjs` conserva las pruebas de navegador con destinos externos interceptados y actualiza sus aserciones al contrato de cinco campos. Ese conjunto completo requiere su entorno Playwright; distinguirlo de la revisión manual de navegador descrita a continuación.

Revisión manual en navegador sobre copia local, con el cargador de GTM retirado y navegación externa impedida: escritorio 1280×720 con analítica denegada y móvil 390×844 con analítica aceptada. Se activaron los 11 orígenes con doble clic de salida: 11 eventos WhatsApp y 11 identificadores distintos en cada caso, sin errores JavaScript ni valores personales sintéticos en eventos. Se probaron detalles, credenciales/documentos, navegación y menú móvil; cálculo terminado, entrada inválida y cancelación de animación. El consentimiento publicitario permaneció denegado.

Estas pruebas no acreditan todavía recepción de los parámetros nuevos en GA4 de producción ni su atribución a clics reales de anuncios. Esa validación requiere aprobación de despliegue/publicación. Tampoco prueban envío de mensajes a WhatsApp.

Rendimiento: se mantienen los mismos archivos JavaScript y estilos, sin nuevas librerías ni instalación de terceros. Las mediciones locales de carga incluyen una herramienta de QA retirada de producción y no son una auditoría de Core Web Vitals. Tras publicar con aprobación, revisar latencia y peticiones de GTM en producción antes de incorporar `ui_click` al informe.
