# Landing de Gerardo España

Sitio estático sin dependencias de producción. `index.html` contiene la página y estilos; `engine.js` conserva la simulación financiera original; `app.js` maneja formularios, gráfica y contacto. Publicación prevista en GitHub Pages después de aprobar y fusionar el PR.

## Diagnóstico y validación

En el commit `a3dbba8`, la interfaz leía `latestSimulation.annual`, pero `simulate()` devuelve un arreglo. Esto producía un arreglo vacío y un resultado de cero. `6fbb465` ya corrigió esa lectura; todavía quedaban secuencias literales `\n` que invalidaban el script de contacto y varias reglas CSS, y el monto se ocultaba durante la animación. La interfaz ahora valida explícitamente el arreglo, su longitud y saldos finitos, sin convertir errores en cero.

Ejecutar `node test.cjs`: cinco combinaciones (18/2000/65, 35/2000/65, 64/2000/65, 40/5000/70, 18/1000000/90), aportaciones acumuladas, sensibilidad al monto y reproducción independiente del primer año con cargos.

## Límites del escenario

Se conservan los cargos, tratamiento de IVA, UDI fija de 8.81 y tabla/tasa de bono del motor original. No existe documentación contractual en el repositorio que los valide. La gráfica usa `saldoTotal` antes de impuestos, nunca `saldoNeto` ni beneficio fiscal. Se desactiva el cálculo fiscal interno en esta interfaz (`isrPct: 0`); no se reinvierte un beneficio fiscal. No se utilizan las afirmaciones de exención del motor para comunicar resultados.

El plazo enviado al motor se limita a 25 años, conservando las aportaciones hasta la edad elegida. No implica renovación o continuidad contractual garantizada; la aplicación de cargos y bono más allá del contrato requiere revisión. La tasa bruta es 10% efectivo anual, con aportaciones al inicio de cada mes según el motor existente. Ni los costos ni los rendimientos constituyen una cotización oficial.

Referencia fiscal: [SAT, aportaciones complementarias de retiro](https://www.sat.gob.mx/minisitio/DeduccionesPersonales/aportaciones_complementarias.html). La referencia de ISR del 20% no es un cálculo personalizado y está sujeta a requisitos y límites.

Teléfono corregido y confirmado por Gerardo: `+52 442 377 7762`. Se verifican estructura de URL y mensajes, con número confirmado por el propietario. No se enviaron mensajes. AMIB, CNSF y relación con Allianz se comunican con vigencia/documentación pendiente de verificación; EBC indica titulación pendiente.
