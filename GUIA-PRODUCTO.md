# Línea del tiempo de la asesoría

La sección «¿Cómo se vería tu asesoría?» se simplifica en seis pasos conectados por una línea vertical. En escritorio, el texto alterna a ambos lados; en móvil queda a la derecha de los iconos.

1. Nos conocemos: presentación del asesor, credenciales y compañía.
2. Hablamos de tus metas: el visitante comparte solo lo que quiera.
3. Entiendes el plan: reglas, costos, riesgos, posibles rendimientos, condiciones fiscales y dudas.
4. Exploras tu proyección: simulador y comparación de escenarios ilustrativos.
5. Decides si es para ti: sin obligación de contratar.
6. Te acompaño después: firma y seguimiento si decide contratar.

La oferta muestra «40 minutos», «Asesoría Gratis» y «En línea · Sin obligación de contratar». Se retiran de esta sección las siglas, explicaciones de certificaciones y el recuadro de regulación. Estos temas se revisan durante la asesoría; la sección de credenciales de la página de inicio no cambia.

Cada paso incorpora un icono SVG propio y ligero. La curva del icono de proyección tiene una animación discreta en CSS, que se desactiva cuando el navegador solicita reducir movimiento. No hay dependencias ni scripts nuevos.

Se conserva el botón final, su texto, identificadores y funcionamiento. Los cambios se limitan a la sección informativa compartida por /simulador/ y /mi-proyeccion/ y su hoja de estilos. No cambian cálculos, registro, CRM, privacidad, medición, inicio del sitio ni Google Ads.

## Validación

La prueba test-product-guide.cjs verifica ambas rutas y, con la carpeta anterior como argumento, compara los límites del cambio, el CTA y los archivos no afectados. La revisión visual local comprueba la línea vertical y la legibilidad en computadora y celular. La propuesta se entrega en el mismo PR #31, sin fusión ni publicación.

Comprobación terminada: 75 verificaciones de contenido y límites del cambio aprobadas. Vista previa en 1280 × 800 y 390 × 844 sin desbordamiento horizontal; en escritorio se confirmó la alternancia y en móvil la columna única. La animación decorativa muestra una duración de 5 segundos y está excluida de lectores de pantalla. No se repitieron envíos al CRM ni auditorías generales.
