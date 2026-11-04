# Simulador con registro y proyección completa

Cambio para revisión: no implica desplegar la landing, modificar campañas o conectar HubSpot con Google Ads.

## Recorrido

1. Abre `/simulador/` sin un registro previo en ese navegador. Calcula con los campos existentes.
2. Se muestra el resultado de 8% en millones, con dos decimales, y un relleno desenfocado para el de 12%. El importe real superior no se escribe en el DOM, los atributos, la gráfica ni los textos accesibles de esta página.
3. Pulsa **Ver hasta dónde puedo llegar**. Escribe nombre y un teléfono mexicano de diez dígitos, y acepta expresamente el aviso y el contacto sobre la simulación.
4. **Continuar** envía al formulario real de HubSpot mediante su API pública de formularios, sin tokens privados. El botón y los campos se bloquean mientras está pendiente. Un error deja la página abierta y permite reintentar.
5. Solo después de una confirmación de HubSpot se guarda el estado local y se navega a `/mi-proyeccion/`, sin nombre, teléfono ni datos financieros en su URL.
6. La página completa permite editar los tres campos y recalcula inmediatamente sin enviar otro formulario. Muestra ambos resultados exactos, su diferencia, la diferencia de empezar un año después y aportado frente a rendimiento neto ilustrativo.
7. **Quiero llegar a ese número** prepara WhatsApp con los datos actuales. No envía el mensaje automáticamente. El mensaje permanece en memoria y no se coloca en atributos de un enlace que pudieran copiarse a la medición de clics.
8. Al volver a `/simulador/`, una persona con estado local vigente ve **Ver mi proyección completa** sin otro formulario ni otro cálculo obligatorio.

## Cálculos y supuestos

`engine.js` y `projection-metrics.js` no cambian. Se llama al mismo motor con .08 y .12 de rendimiento bruto anual. Conserva cargos, bono, periodicidad, impuestos ilustrativos y los demás supuestos existentes; no se introduce una fórmula alternativa de interés compuesto. El formulario actual no tiene ahorro inicial, por lo que no se inventa ese campo.

Empezar un año después se calcula con edad actual + 1, un año menos de aportaciones y la misma edad de retiro. Cuando queda un solo año hasta el retiro, el escenario aplazado tiene cero aportaciones y saldo cero. Rendimiento neto ilustrativo significa saldo proyectado menos aportaciones, con los componentes del motor vigente; no es rendimiento garantizado ni una cotización.

## HubSpot y límite gratuito

Se reutilizan `firstname` y `phone`. El teléfono se guarda como +52 y los diez dígitos introducidos. Con autorización del usuario, las cuatro UTM se agrupan en una propiedad de texto con sus nombres explícitos, para respetar el límite de diez propiedades personalizadas de Contacto:

| Propiedad | Tipo | Contenido |
| --- | --- | --- |
| `ppr_edad_actual` | Número | Edad actual |
| `ppr_edad_retiro` | Número | Edad de retiro |
| `ppr_aportacion_mensual` | Número | Aportación mensual |
| `ppr_resultado_8` | Número | Resultado del motor con 8% |
| `ppr_resultado_12` | Número | Resultado del motor con 12% |
| `ppr_fecha_simulacion` | Texto | Fecha y hora ISO en UTC |
| `ppr_gclid` | Texto | Identificador validado, solo con permiso publicitario |
| `ppr_campana_utm` | Texto de varias líneas | JSON con utm_source, utm_medium, utm_campaign y utm_term; valores vacíos cuando faltan |
| `ppr_consentimiento_simulacion` | Casilla | Sí en un envío expresamente aceptado |
| `ppr_origen_lead` | Texto | Simulador de retiro |

El envío incluye también `legalConsentOptions.consent.consentToProcess`, el texto del consentimiento y una lista vacía de suscripciones de comunicación: no suscribe a marketing. Los seis campos anteriores de Negocios permanecen intactos. Las dos propiedades UTM individuales creadas durante la preparación se archivaron vacías, con autorización, para sustituirlas por el campo agrupado.

Está habilitada la opción de HubSpot que permite crear contactos sin correo. Es un ajuste general de formularios de esa cuenta, no una deduplicación por teléfono.

## Privacidad, cookies y atribución

- La autorización de este formulario es distinta de las preferencias de cookies. No concede permisos de analítica, publicidad o personalización.
- Nombre, teléfono, edades, aportación, resultados y mensaje no se añaden a dataLayer ni a nuevos eventos. No se agregan etiquetas o conversiones. Los eventos existentes conservan sus identificadores.
- `pageUri` del contexto del formulario queda limpio, sin consulta ni fragmento. Los parámetros de campaña se validan por separado. No se transmite una IP adicional obtenida de otro servicio.
- Se adjunta una cookie `hubspotutk` existente y de formato válido únicamente con consentimiento de analítica. Este cambio **no instala el rastreador de HubSpot**, por lo que esa cookie puede no existir y no se garantiza asociación con visitas previas ni clasificación automática de Google Ads en «Original Traffic Source». Guardar UTM/gclid no equivale a esa asociación.
- La prueba real se realizó sin esa cookie. HubSpot muestra el aviso correspondiente. No se inventó un identificador para ocultarlo.
- El aviso de privacidad se actualiza solo para describir el registro financiero ilustrativo, el proveedor HubSpot, las finalidades, el consentimiento expreso y el almacenamiento solicitado.
- Se conservan nombre, los tres datos de simulación y la marca local durante 30 días desde la última simulación. No se conserva el teléfono en ese registro. Si el almacenamiento está bloqueado, se informa y no se redirige; en esa misma página, reintentar tras un envío ya confirmado no vuelve a crear un registro.

## Acceso y duplicados: límites

El primer script de `<head>` comprueba el estado antes de cargar los demás scripts. Sin estado válido, el documento permanece oculto y se redirige al simulador. La ruta completa lleva `noindex, nofollow`; no se añade a menús o sitemap. Este bloqueo local es un flujo de navegación, **no autenticación de servidor**: alguien que modifique manualmente su navegador puede eludirlo.

La página evita doble clic, reenvío durante la misma solicitud y registros nuevos tras el desbloqueo. No se garantiza unicidad entre otros navegadores, dispositivos o una recarga tras una respuesta de red ambigua. HubSpot no deduplica por teléfono estos formularios. En el plan gratuito conviene revisar coincidencias por teléfono normalizado antes de crear una oportunidad y fusionar solo tras verificar la identidad. No se configuró un flujo de pago ni se convierte un registro en conversación real o prospecto calificado.

No se implementa la actualización opcional del contacto al pulsar WhatsApp: los recálculos posteriores son locales.

## IDs estables

| Control | ID |
| --- | --- |
| Simulador / formulario de cálculo | `simulador` / `retirementForm` |
| Campos de cálculo | `ageNow`, `monthlyContribution`, `ageRetirement` |
| Calcular | `calculateButton` |
| Abrir registro | `unlockProjectionButton` |
| Formulario de registro | `projectionLeadForm` |
| Nombre, teléfono y aceptación | `projectionLeadName`, `projectionLeadPhone`, `projectionLeadConsent` |
| Continuar / error | `projectionLeadContinue` / `projectionLeadStatus` |
| Proyección ya desbloqueada | `completeProjectionLink` |
| WhatsApp final | `projectionWhatsAppButton` |

## Pruebas

Pruebas aisladas ejecutables desde el directorio del sitio, sin llamadas a servicios reales:

```text
node test-projection-flow.cjs
node test-simulator-route.cjs
node test-attribution.cjs
node test-consent-ui.cjs
```

`test-measurement.cjs` se adapta al nuevo recorrido e intercepta HubSpot, Google y WhatsApp. Se comprobó su sintaxis; no se ejecutó ese guion con Playwright en esta sesión. La prueba de navegador se hizo por la herramienta de navegador integrado sobre una vista HTTP local que suprime las etiquetas de Google.

La prueba real de HubSpot creó un contacto sintético identificado como **PRUEBA CRM SIMULADOR NO ES PROSPECTO**, comprobó las diez propiedades personalizadas, nombre, teléfono, consentimiento nativo y redirección limpia. No debe contarse como prospecto comercial. Los detalles privados y las capturas se entregan fuera de este repositorio público.

La vista de escritorio y el recálculo se comprobaron en navegador. Se solicitó 390 × 844 para móvil, pero el navegador no respetó ese tamaño; no se presenta la captura resultante como prueba visual móvil. Las pruebas aisladas del lienzo a 340 px sí pasaron.

## Fuentes oficiales

- [API pública de envío de formularios](https://developers.hubspot.com/docs/api-reference/legacy/marketing/forms/v3-legacy/submit-data-unauthenticated).
- [Crear contactos sin correo](https://knowledge.hubspot.com/forms/how-can-i-allow-form-submissions-without-email-addresses-to-create-contacts-in-hubspot).
- [Deduplicación de registros y sus límites](https://knowledge.hubspot.com/records/deduplication-of-records).
