# Tercer documento de modificaciones

Portada con menos espacio superior, foto de fondo a la izquierda y máscara CSS que la difumina hacia el texto de la derecha. Se usan “El punto es comenzar con algo”, “No improvises tu futuro. Define lo que necesitas.” y la presentación del propietario. En móvil el retrato pasa arriba y se difumina hacia la información. La imagen original no se modifica.

El resultado muestra “Libre de impuestos” sin asterisco, con la explicación de requisitos y límites en Detalles de proyección. No se cambia el motor ni se utiliza su antigua lógica de saldoNeto como prueba de un impuesto real. No se reinvierte ni acumula el beneficio fiscal para la interfaz.

Tres tarjetas horizontales muestran plazo de proyección, aportaciones acumuladas y referencia fiscal anual. $2,000 mensuales producen $6,000 anuales al 25% de ISR, con límite de cinco UMA de 2026 y supuesto de ingresos suficientes para el límite del 10%, explicado en los detalles. Fuentes primarias en README.md. No se muestra el beneficio total por plazo.

Los avisos y controles impiden bajar de 18 años de inicio y 65 de retiro mediante botones, teclado y escritura. Se conservan validación de vacíos, enteros y rangos.

Se elimina el CTA redundante de Sobre mí; el visor iguala la altura de información y redes. AMIB y CNSF abren un popup grande con imágenes. Se retiran enlaces y archivos PDF de la publicación actual. Esto no impide guardar imágenes, hacer capturas o recuperar archivos del historial Git; no se promete protección de descarga.

Favicon con el monograma suministrado: trazos blancos, barras azules y fondo marino. El logo horizontal se conserva legible sobre el fondo blanco de la barra.

## Validación

node test-metrics.cjs: caso $6,000, sensibilidad a la aportación, cinco UMA e inputs inválidos.

Chrome/Playwright a 1440, 1100, 900, 768, 620, 390 y 320 px: portada, altura de galería, ausencia de desbordamiento, credenciales sin pestañas, edades mínimas, tarjetas y recálculo. A 1440 px se comprueba la animación de cuatro segundos sin anticipar tarjetas; el resto usa preferencia de movimiento reducido. Inspección visual de portada, resultado y visor; sin errores JS ni recursos locales rotos. Sintaxis y git diff --check pasan. Motor original sin cambios y sin dependencias nuevas de producción.

## Corrección de visibilidad y mensajes del formulario

Se reprodujo en la página publicada la causa de los banners aparentemente ausentes: con ventana de 1366×768 px, empezaban en y=736.9 y terminaban en y=863.5, fuera del área inicial visible del popup. Ahora usan fondo dorado claro, tarjetas contrastantes y desplazamiento automático al finalizar para mostrarlos completos. Se conservan solo plazo, aportaciones acumuladas y beneficio fiscal anual de referencia; el total fiscal del plazo sigue excluido.

Se elimina reportValidity() y la validación automática del navegador en este formulario mediante novalidate. La validación propia cubre campos vacíos, números, enteros, mínimos y máximos, con banners en español y aria-invalid. Impide calcular con inicio menor de 18, retiro menor de 65 o aportación mensual menor de $2,000; no aumenta silenciosamente la aportación escrita. Los controles de edad y ArrowDown muestran los avisos solicitados al llegar al límite.

El favicon PNG es una copia exacta de la imagen adjuntada por el propietario; se genera también ICO para compatibilidad. Los enlaces usan nombres nuevos y se versionan app.js, updates.css y projection-metrics.js para evitar mezclar recursos anteriores almacenados en caché.

Validación de esta corrección: Chrome en locale en-US a 1366×768, 390×844 y 320×680; todos los mensajes de mínimos y vacíos en español, sin eventos de validación nativa, sin cálculo inválido, banners horizontales completos dentro de la ventana después de animar, $6,000 anuales para $2,000 mensuales, $15,000 para $5,000, detalles de ISR del 25%, recálculo e iconos nuevos disponibles. Sin errores JavaScript ni desbordamiento. La referencia fiscal y el motor financiero permanecen sin cambios.
