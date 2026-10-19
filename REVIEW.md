# Modificaciones de perfil y servicios

Se aplican las indicaciones de “Ediciones Página Web (2).pdf”: navegación con logo y separador de redes junto a la marca, asesoría al extremo derecho, detalles del simulador plegados, galería lateral de credenciales, enlaces subrayados en servicios y popups con mensajes por servicio. El favicon usa el monograma del logo de pestaña proporcionado, para conservar legibilidad a 16–64 px; los dos SVG completos se mantienen en assets.

La galería muestra la foto original al pulsar Allianz, la foto de birrete al pulsar estudios y una vista del certificado AMIB al pulsar AMIB, con acceso al PDF completo. El documento recibido indica del 4 de junio de 2026 al 4 de junio de 2029. Esto no es una consulta en tiempo real a un registro de autorizaciones. El texto académico dice únicamente “Estudios en Escuela Bancaria y Comercial (EBC)”, sin afirmar título expedido.

## Pendientes materiales

- La ruta virtual de Google Drive de la cédula CNSF devolvió acceso denegado incluso con autorización para el archivo y su carpeta. Se conserva un estado de revisión en asesoría al seleccionar CNSF. Hace falta adjuntar una copia accesible para integrar y revisar el documento.
- No se etiqueta el saldo como totalmente libre de impuestos. El motor devuelve saldoTotal y no calcula el impuesto personal al retiro. Cumplir la edad de retiro no implica exención ilimitada; se agrega el texto “Retiro con beneficios fiscales, sujeto a requisitos y límites de exención”. No se modifica el motor ni se fabrican parámetros fiscales.
- El chip de 30% de descuento y el texto de cotización instantánea se incluyen por indicación del propietario. La vigencia, elegibilidad y condiciones de la promoción requieren confirmación comercial al cotizar; no se inventan fechas o coberturas aplicables.

Referencia fiscal: [SAT, artículo 93](https://wwwmat.sat.gob.mx/articulo/15199/articulo-93) y [SAT, efectos fiscales de planes personales de retiro](https://sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2025/rmf/compiladas/Compilado_Segunda_Modificacion_RMF_2025-07042025.pdf), regla 3.17.6. El excedente de la exención puede estar sujeto a ISR aun cumpliendo requisitos de permanencia.

Foto del vehículo: Nissan Sentra 2024, [comunicado de Nissan México](https://mexico.nissannews.com/es-MX/releases/nissan-anuncia-el-inicio-de-ventas-del-nuevo-nissan-sentra-2024). La imagen identifica el modelo y no implica relación comercial con Nissan.

## Comprobaciones

`node test.cjs` pasa las cinco combinaciones financieras existentes; no se modifica engine.js. Chrome/Playwright: 1440, 1100, 900, 768, 620, 390 y 320 px; barra y redes visibles, sin desbordamiento; galería y retorno a fotografía; múltiples opciones de seguros y bloqueo sin selección; reinicio correcto entre servicios; mensajes y URL al número confirmado; detalles cerrados inicialmente; simulador operativo; sin errores JavaScript ni recursos locales rotos. No se enviaron mensajes de WhatsApp.
