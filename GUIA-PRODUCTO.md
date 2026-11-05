# Recorrido de la asesoría debajo del simulador

La sección «¿Cómo se vería tu asesoría?» sustituye la explicación previa del producto en `/simulador/` y `/mi-proyeccion/`.

## Contenido

1. Presentación de Gerardo España, sus credenciales y la compañía con la que se contrataría el plan.
2. Panorama y metas del visitante, compartiendo únicamente lo que desee.
3. Funcionamiento, condiciones, costos, riesgos, fiscalidad, rendimientos proyectados y dudas.
4. Corrida financiera interactiva durante la asesoría, con cambios que el cliente puede explorar directamente.
5. Evaluación de si el plan encaja con sus objetivos, sin obligación de contratar.
6. Explicación del proceso posterior de contratación, firma acompañada y seguimiento durante el plan.

La oferta conserva la asesoría inicial gratuita de 40 minutos en línea. El proceso de contratación y el seguimiento se sitúan después, si el visitante decide avanzar.

La gráfica decorativa del punto 4 ilustra la comparación de escenarios; no muestra cifras, datos del visitante ni resultados reales y no es otro simulador. Está oculta a lectores de pantalla porque la explicación equivalente está en el texto.

## Credenciales y regulación

- Se reutilizan las credenciales ya publicadas en la sección «Sobre mí»: AMIB Figura 3 y cédula de agente de seguros CNSF. No se añaden títulos, números de licencia ni habilitaciones nuevas.
- La autorización y supervisión de Allianz México se atribuyen a la CNSF. CONDUSEF se identifica por su función de protección y defensa del usuario; no se describe como una garantía estatal, un respaldo de rendimientos o un aval de la inversión.
- [Directorio oficial de instituciones de la CNSF](https://listainstituciones.cnsf.gob.mx/): Allianz México, S.A., Compañía de Seguros, consultado el 5 de noviembre de 2026.
- [Información legal de Allianz México](https://www.allianz.com.mx/legales/legales-mexico/legales-allianz.html): referencias a CONDUSEF, unidad de atención y Buró de Entidades Financieras.

## Límites y comprobación

Se conserva el CTA final existente, sus textos, atributos y función. No cambian el inicio del sitio, el simulador, las fórmulas, animaciones, registro CRM, privacidad, medición ni Google Ads.

`node test-product-guide.cjs` verifica la integración del nuevo contenido. Al pasar como argumento la carpeta de la versión anterior, compara también el contenido anterior y posterior a la sección, el CTA y los demás archivos existentes.

Validación realizada en vista previa local: computadora a 1280 × 800 y celular a 390 × 844, sin desbordamiento horizontal. Se comprobaron el orden de los seis pasos, la lectura del contenido, el recuadro de la compañía y la adaptación de la ilustración. Pasaron 70 comprobaciones enfocadas de contenido y límites del cambio. La prueba existente del flujo se adapta únicamente para sustituir su antigua comprobación del texto «19 alternativas de inversión» por el nuevo título. No se repitieron envíos al CRM ni la batería general del sitio.

La prueba existente del flujo pasó sus 19 comprobaciones aisladas, sin solicitudes de red ni contactos reales.

La propuesta se entrega en PR y la publicación requiere aprobación separada.
