# Información del plan debajo del simulador

Se organiza el contenido existente en tres secciones compartidas por `/simulador/` y `/mi-proyeccion/`:

1. Alternativas de inversión y decisión del cliente, con un ejemplo visual de agrupación de empresas y compras periódicas.
2. Comparación de las modalidades de los artículos 151 y 93: aportación, retiro y retiro anticipado.
3. Etapas del plan: primeros 18 meses y continuidad desde el mes 19.

Las ilustraciones son ejemplos conceptuales, no carteras reales ni pronósticos de precios. Se conserva el botón final, sus identificadores y su funcionamiento. No se modifican cálculos, datos enviados al CRM, registro, privacidad, medición ni publicidad.

## Precisiones fiscales y contractuales

- Los primeros 18 meses equivalen a 18 aportaciones únicamente con frecuencia mensual.
- Artículo 151: la deducción anual es el menor de 10% de ingresos acumulables y 5 UMA anuales; la permanencia ordinaria es hasta los 65 años, con excepciones legales. La retención del 20% se describe como provisional y sobre el monto fiscalmente gravable para el retiro total anticipado.
- Artículo 93: aportaciones no deducibles. La exención exige 60 años y al menos 5 años de contrato, primas pagadas por el asegurado y demás requisitos.
- Para retiros anticipados del seguro del artículo 93, la regla permite que la aseguradora opte por retener 20% sobre intereses reales gravables (RLISR 224). No se afirma que sea 20% de todo el ahorro ni una tasa efectiva invariable que Allianz aplique a toda operación. Las condiciones generales remiten a la legislación vigente y no fijan una elección universal de la aseguradora.
- El descanso de hasta 12 meses y los ajustes posteriores se expresan sujetos a requisitos y condiciones, no como derechos incondicionales.

## Fuentes oficiales consultadas el 5 de noviembre de 2026

- [Allianz: OptiMaxx plus y 19 alternativas](https://www.allianz.com.mx/seguros/ahorro-e-inversion/seguro-ahorro.html).
- [Catálogo oficial de condiciones generales](https://www.allianz.com.mx/servicios/consultas/descarga-de-documentos.html): documento del artículo 151, CNSF S0003-0134-2026, facilitado por el titular; documento del artículo 93, CNSF S0003-0318-2019, listado actualmente por Allianz. Art. 93: condiciones p. 29; art. 151: capítulo fiscal y cláusulas de aportaciones iniciales, descanso y distribución de inversiones.
- [SAT: aportaciones complementarias de retiro](https://www.sat.gob.mx/minisitio/DeduccionesPersonales/aportaciones_complementarias.html).
- [LISR 133: intereses de retiros de seguros](https://wwwmat.sat.gob.mx/articulo/19221/articulo-133).
- [LISR 145: retención provisional](https://wwwmatnp.sat.gob.mx/articulo/88309/articulo-145).
- [Reglamento LISR, artículo 224](https://www.sat.gob.mx/cs/Satellite?blobcol=urldata&blobkey=id&blobtable=MungoBlobs&blobwhere=1461175105616&ssbinary=true).

## Comprobación del cambio

`node test-product-guide.cjs` comprueba estructura, títulos accesibles y ausencia de scripts o dependencias nuevas. Con la carpeta de la versión previa como argumento, comprueba también que no cambien las secciones anteriores y posteriores, el CTA ni los demás archivos existentes.

Prueba visual local en 1280 × 800 y 390 × 844: ilustraciones, columnas fiscales y línea de tiempo adaptadas a cada pantalla; sin desbordamiento horizontal. Comprobación del contenido idéntico en ambas rutas y apertura del formulario existente sin realizar envíos al CRM.

La revisión se prepara en PR, sin publicación automática.
