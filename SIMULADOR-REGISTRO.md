# Simulador y solicitudes comerciales — revisión de noviembre de 2026

Esta versión está preparada para revisión; no publica cambios ni modifica Google Ads. Conserva el motor y los escenarios del 8% y 12%.

## Recorrido
- /simulador/: saldo inferior completo en MXN, redondeado al peso; marcador superior ficticio borroso. El resultado de 12% no se escribe en el DOM, atributos, gráfica o texto accesible públicos.
- Escritorio: importes en una fila con guion. Móvil: inferior arriba, superior después de la gráfica y antes de la leyenda. Autoalineación bajo la barra al calcular; respeta movimiento reducido.
- El marcador y Ver hasta dónde puedo llegar abren el mismo diálogo nativo accesible. Nombre, teléfono mexicano de diez dígitos y casilla explícita.
- Casilla de simulación: «Acepto el aviso de privacidad y autorizo guardar mi simulación y contactarme respecto a mi simulación.»
- Solo tras confirmación de HubSpot se habilita el acceso y abre /mi-proyeccion/, sin datos personales en su URL.
- Resultados completos en las mismas posiciones, sin los bloques de diferencia, aplazamiento o aportado/rendimiento. Sus cálculos internos no se reescriben.
- Quiero llegar a ese número pulsa cada tres segundos, muestra Redirigiendo a WhatsApp y navega al mensaje con los valores actuales. No envía mensajes por sí mismo.
- Supuestos compartidos visibles, explicación ilustrativa en Detalles de proyección y resumen del producto debajo, sin artículo 185 ni mención de ETF. Las 19 alternativas están descritas como opciones de selección según perfil y metas, no como inversión obligatoria en todas.

## Accesos de contacto
| Botón | Destino |
| --- | --- |
| Asesoría en barra, portada y franja final | Formulario CRM · PPR / Asesoría |
| Icono de la barra superior | WhatsApp directo con icono y enlace originales |
| Icono de contacto de Sobre mí | Icono de conversación y formulario CRM |
| Flotante inferior derecho | WhatsApp directo, conserva icono |
| Conoce más · Plan de retiro | /simulador/, conserva parámetros admitidos |
| Conoce más · Seguros | WhatsApp directo: Residencial, Vida y Gastos Médicos en el mensaje |
| Conoce más · Bolsa | WhatsApp directo con mensaje de bolsa |
| Conoce más · Auto | WhatsApp directo con campos de cotización en el mensaje |
| Quiero contratar | Formulario CRM con título Te contactaremos para contratar tu plan |

Después de los formularios se muestra En un momento te contactaremos. Los generales permanecen en la página; el de simulación abre los resultados después de una confirmación breve.

## HubSpot gratuito
Se reutilizan el formulario público existente y sus diez propiedades de Contacto; no hay tokens privados, nuevas suscripciones, conexión con Ads ni rastreador de HubSpot.

Los parámetros publicitarios siguen sus preferencias vigentes: gclid solo con permiso publicitario; una cookie hubspotutk existente solo con Analítica. La autorización del formulario no concede cookies o publicidad personalizada.

- Simulación: nombre, teléfono, tres entradas, ambos resultados exactos, fecha, gclid y cuatro UTM agrupadas, marcador de consentimiento de simulación y origen.
- Asesoría / contratación: nombre, teléfono, parámetros disponibles y origen; consentimiento nativo de procesamiento con el texto de la solicitud. No se envían edades, importes, resultados, fecha de simulación ni marcador de consentimiento financiero inventados.
- Contexto pageUri limpio; pageName restringido a los tres títulos propios. Sin parámetros arbitrarios ni IP adicional.
- ppr_origen_lead identifica producto, intención y botón: PPR | Simulación | simulator_range; PPR | Asesoría | wa_hero_advisory; PPR | Solicitud de contratación | product_contract.
- Una solicitud de contratación no se marca como contrato, cita o prospecto calificado.
- El valor de origen de Contacto representa el último guardado; los envíos constituyen el historial.

No se instala detección automática por teléfono ni un contador que sume contactos distintos. El contador nativo de formularios es por contacto y no resuelve esta deduplicación. Se mantiene la revisión manual autorizada.

## Sesión y seguridad
Se sustituye la persistencia de 30 días por sessionStorage (ppr-projection-session-v2), hasta cerrar la pestaña y como máximo 24 horas desde el último cálculo. El código retira la marca local antigua. No guarda el teléfono en el almacenamiento de sesión. El acceso no depende de una cuenta de Google.

Una pestaña nueva normalmente requiere registro. Algunos navegadores restauran sesiones cerradas o copian el estado al duplicar pestañas. El bloqueo local es navegación, no autenticación de servidor; un usuario técnico puede eludirlo. /mi-proyeccion/ mantiene el primer script de guardia, documento oculto hasta validar y noindex, nofollow; no se añade a menús o sitemap.

Bloqueo del doble envío y del cierre mientras se guarda; errores permiten reintentar. Un envío ya confirmado no se repite en esa página cuando falla el almacenamiento. Recalcular en la página completa no envía nuevos contactos. No hay actualización posterior automática del CRM.

## Medición
No se cambian GA4, GTM, sus etiquetas, Consent Mode o conversiones de Ads. El código de medición de la web solo admite abrir/cerrar el icono de Sobre mí que pasa a formulario. Los eventos existentes y sus IDs se conservan. Los formularios no disparan whatsapp_contact; ese evento se reserva para salidas reales a WhatsApp. No se crea un evento clave de formulario ni se transmiten valores financieros o PII a dataLayer.

## Pruebas
Desde el directorio del sitio:
- node test-projection-flow.cjs
- node test-lead-dialog.cjs
- node test-simulator-route.cjs
- node test-ui-measurement.cjs

Comprueban motor sin cambios, presentación, sesión, guardia, privacidad, origen, ausencia de simulaciones inventadas, bloqueo del doble clic, errores y reintentos, y separación entre solicitudes y salidas WhatsApp.

test-measurement.cjs se adapta al nuevo flujo y se comprueba su sintaxis; no se declara ejecutado con Playwright en esta sesión. Las pruebas de navegador se realizan con la herramienta del navegador integrado y un servidor local que suprime etiquetas de Google.

Se prueban escritorio y móvil real de 390 × 844, modal, foco/cierre, desplazamiento, importes y enlaces. Los envíos reales sintéticos de simulación, asesoría y contratación se comprueban en HubSpot; las evidencias y sus identificadores permanecen fuera de este repositorio público y se excluyen de resultados comerciales.

## Referencias
- https://www.allianz.com.mx/seguros/ahorro-e-inversion/seguro-ahorro.html
- https://www.allianz.com.mx/content/dam/onemarketing/iberolatam/allianz-mx/ahorro---plus/documentos---plus/Folleto%20OptiMaxx%20plus%202025.pdf
- https://knowledge.hubspot.com/records/deduplication-of-records
- https://knowledge.hubspot.com/properties/hubspots-default-contact-properties
