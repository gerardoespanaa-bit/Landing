# Etiqueta de Google Ads AW-18527900519

El propietario solicitó el 7 de noviembre de 2026 instalar directamente el snippet de Google correspondiente a AW-18527900519. Se añade una sola copia idéntica en el head de index.html, simulador/index.html, mi-proyeccion/index.html y aviso-de-privacidad.html.

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-18527900519"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'AW-18527900519');
</script>
```

## Orden y alcance

El snippet se coloca después de los consentimientos denegados por defecto y del arranque de preferencias y metadatos de privacidad, antes del contenedor GTM existente. El bloque del usuario no se altera ni se le añaden opciones.

GTM-KMG6BPKF y su noscript se conservan sin cambios. GA4 G-VSNRQ7H8JL sigue configurado mediante GTM; no se añade una instalación directa de GA4 ni una segunda etiqueta de Google Ads. La referencia de las notas históricas a «sin gtag.js» describe esas implementaciones anteriores, no este cambio autorizado.

El snippet utiliza la misma dataLayer. Configurar este destino no concede consentimiento: analytics_storage, ad_storage y ad_user_data continúan sujetos a las preferencias ya existentes. ad_personalization permanece denegado. No se modifica el contenedor ni se configura remarketing, audiencias o eventos de conversión adicionales.

El código de acceso a /mi-proyeccion/ continúa siendo el primer script del head. No se modifican cálculos, diseño, formularios, datos enviados al CRM ni campañas de Google Ads, presupuesto, pujas, anuncios, conversiones o seguimiento de URLs.

## Validación

- test-google-ads-tag.cjs: snippet exacto y único en las cuatro páginas, posición dentro del head, orden respecto al consentimiento, conservación de la cola, configuración de un solo destino y estados sin elección, rechazo, analítica, medición publicitaria y ambas autorizaciones. Comprueba revocación y personalización denegada. Con la carpeta anterior como argumento, comprueba que retirar el snippet deja cada HTML idéntico a su versión aprobada.
- test-attribution.cjs: actualiza únicamente la antigua prohibición de todo gtag.js para permitir el destino AW explícitamente autorizado, conservando la protección frente a una instalación directa de GA4, las preferencias y la atribución.
- test-consent-init.cjs: regresión del consentimiento existente.

Las comprobaciones son locales y sin solicitudes a Google. No demuestran recepción real ni ausencia de configuraciones repetidas dentro de un contenedor remoto. La comprobación de recepción en producción corresponde al despliegue aprobado; no se afirma que la etiqueta ya esté publicada por preparar el PR.

Resultado de pruebas: 104 comprobaciones específicas del nuevo snippet, 86 de atribución y 23 del consentimiento existente, todas aprobadas. Además, los otros 48 archivos de texto anteriores se conservaron idénticos. Se leyó, sin alterarlo, el contenedor público GTM-KMG6BPKF: la respuesta del 7 de noviembre de 2026 incluye G-VSNRQ7H8JL y no incluye el identificador 18527900519. Esa lectura puntual no sustituye una validación de recepción real tras publicar.

La publicación se mantiene como autorización separada del propietario.
