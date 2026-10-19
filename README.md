# Landing de Gerardo España

Sitio estático sin dependencias de producción. index.html contiene las secciones y estilos base; updates.css contiene ajustes visuales. engine.js conserva el motor financiero original; projection-metrics.js calcula la referencia fiscal anual, y app.js maneja gráfica, contacto, controles y galería.

## Comprobaciones

Ejecutar node test.cjs para las cinco combinaciones financieras existentes y node test-metrics.cjs para la referencia fiscal anual, límite de cinco UMA e inputs inválidos. simulate() devuelve un arreglo anual; la interfaz lo valida y nunca presupone .annual ni convierte errores en cero. La proyección se calcula antes de animar durante cuatro segundos y permite recalcular.

## Supuestos

Se conservan cargos, IVA, UDI fija de 8.81 y tabla/tasa de bono del motor existente. No hay documentación contractual que los valide. Se muestra saldoTotal y no se calcula ISR personal al retiro. La etiqueta “Libre de impuestos”, solicitada por el propietario, representa el escenario de disposiciones dentro de requisitos y límites de exención explicado en Detalles de proyección; no un saldo neto fiscal personalizado.

El plazo del motor se limita a 25 años; el horizonte de aportaciones hasta la edad elegida no garantiza un plazo contractual equivalente. Rendimiento bruto ilustrativo del 10% efectivo anual, aportaciones al inicio del mes y sin ajuste por inflación. No se reinvierte el beneficio fiscal.

La referencia fiscal anual usa 25% de la aportación anual hasta cinco UMA de 2026 ($213,973.20). Supone ingresos suficientes para cumplir además el límite del 10% de ingresos acumulables y los demás requisitos. Sin ingresos ni régimen fiscal no es una devolución calculada: puede ser menor o nula. No se muestra el beneficio total por plazo.

Fuentes: [SAT, aportaciones de retiro](https://www.sat.gob.mx/minisitio/DeduccionesPersonales/aportaciones_complementarias.html) e [INEGI, UMA 2026](https://www.inegi.org.mx/contenidos/saladeprensa/boletines/2026/uma/uma2026.pdf). Actualizar valores y requisitos para años posteriores.

## Documentos y contacto

Las credenciales se muestran en un visor modal de imágenes, sin enlaces ni pestañas PDF. Se retiran los PDF del árbol actual; las imágenes pueden guardarse o capturarse y el historial público puede conservar versiones anteriores. La copia CNSF omite CURP, RFC y QR. Las fechas provienen de documentos recibidos, sin consulta de registro en vivo.

WhatsApp confirmado: +52 442 377 7762. El 30% de descuento de auto es texto comercial proporcionado por el propietario; las condiciones se consultan al cotizar. No se enviaron mensajes durante las pruebas.

## Privacidad y medición preparadas

`aviso-de-privacidad.html` distingue visita y primer contacto, evaluación y contratación de PPR. Sigue en revisión; 12 meses desde el último contacto es una propuesta de conservación sin aprobar ni implementar. Se accede desde el pie, el contacto por WhatsApp y Sobre mí. Consultar [REVISION-PRIVACIDAD.md](REVISION-PRIVACIDAD.md) para prácticas confirmadas, entrega previa del aviso, consentimiento financiero, solicitudes ARCO, sistemas y eliminación pendientes. No publicar este borrador como aviso definitivo.

El HTML carga GTM mediante los fragmentos oficiales del PR #8, con estados de consentimiento denegados y restricción de etiquetas. GA4 y el flujo alternativo de `measurement.js` siguen desactivados; `measurement-config.js` conserva campos vacíos. Los IDs reales ya fueron recibidos. Unificar la integración antes de activar medición; no operar ambos cargadores. No se modifica el motor financiero.

Consultar [PRIVACIDAD-Y-MEDICION.md](PRIVACIDAD-Y-MEDICION.md) para guía de GTM/GA4 y verificación final con Tag Assistant y DebugView. Sigue pendiente configurar y verificar GA4; la carga del contenedor vacío ya se probó.

`node test-measurement.cjs` ejecuta pruebas de navegador de activación, consentimiento, cargas únicas, eventos, exclusión de datos privados, cálculos, contacto y móvil. Requiere Playwright instalado en el entorno de desarrollo y Chrome; no añade dependencias de producción. Se puede indicar `PLAYWRIGHT_MODULE` con la ruta al módulo existente y `CHROME_PATH` con la ruta del ejecutable. `QA_OUTPUT` permite guardar capturas y resultados fuera del repositorio. Las solicitudes de GTM y WhatsApp se interceptan: estas pruebas no envían eventos a Google ni mensajes y no equivalen a DebugView.
