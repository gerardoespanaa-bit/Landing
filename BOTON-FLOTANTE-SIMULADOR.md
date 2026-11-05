# Relevo del botón de proyección completa

Preparado para revisión; no implica publicar ni modificar Google Ads.

- Se activa al terminar una proyección válida en `/simulador/`, para visitantes que todavía no tienen acceso de sesión a los resultados completos.
- El flotante aparece abajo si el original queda por debajo y arriba, debajo de la barra, si queda por encima. Usa el texto «Ver hasta dónde puedo llegar».
- El relevo se hace al quedar el original completo dentro de la zona útil de pantalla. El ancla conserva el espacio y ancho del original; cuando actúa el flotante, el original queda invisible sin retirarse del flujo. Solo hay una acción de este par visible y accesible a la vez.
- Se sincroniza la fase de la pulsación de tres segundos. El movimiento reducido elimina la animación. No se fuerza el desplazamiento para enfocar el botón durante el relevo.
- Usa el mismo formulario, validación, fuente `simulator_range` y consentimiento. No hay un formulario nuevo, un envío al pulsar el flotante ni eventos de medición adicionales.
- Se oculta al invalidar o recalcular, al abrir un diálogo o el menú móvil, y para visitantes con registro de sesión vigente. El foco vuelve al botón adecuado al cerrar el formulario.
- Respeta el espacio del aviso de privacidad sin alterar ninguna preferencia. En móvil, mientras está abajo, coloca el icono flotante de WhatsApp por encima para evitar que se tapen.
- El desplazamiento se agrupa en `requestAnimationFrame`; no hay sondeo continuo ni temporizadores de seguimiento. Se adapta a cambios de tamaño y altura de barra/aviso.

## Identificadores

| Elemento | ID |
| --- | --- |
| Botón original | `unlockProjectionButton` |
| Ancla de posición original | `unlockProjectionAnchor` |
| Botón flotante | `floatingUnlockProjectionButton` |
| Formulario existente | `projectionLeadDialog` / `projectionLeadForm` |

## Comprobaciones

`node test-projection-unlock-dock.cjs`: 12 comprobaciones puntuales, sin solicitudes de red, sobre geometría, relevo en ambas direcciones, exclusión mutua, foco, mismo formulario, aviso, menú, invalidación, estado registrado y movimiento reducido.

Vista previa real en el navegador integrado: escritorio de 1280 × 720 y móvil de 390 × 844. Se verificaron abajo → original → arriba y el regreso; un solo diálogo al pulsar; ocultamiento durante edición/cálculo, preferencias y menú; alineación al ancho original y ausencia de desbordamiento horizontal. No se enviaron contactos al CRM. Las capturas y el informe están fuera del repositorio público.

Los cálculos, resultados, acceso a la página completa, HubSpot, URLs publicitarias, GA4, GTM y Consent Mode se conservan.
