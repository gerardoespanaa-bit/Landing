# Google Ads como única etiqueta activa de Google

Se retiran los cuatro cargadores del contenedor del head y los cuatro bloques noscript del body. Se conserva exactamente una copia del snippet AW-18527900519 en cada página.

El arranque de privacidad deja de depender de identificadores del contenedor o del destino de analítica anterior. Utiliza únicamente el destino de Google Ads autorizado. El metadato de página depurado utiliza un marcador local, y los enlaces al simulador siguen conservando solo los parámetros permitidos y los identificadores publicitarios cuando corresponde según el consentimiento.

La analítica que dependía del contenedor deja de recibir los eventos del simulador y WhatsApp. Se conservan los identificadores de interfaz y las llamadas locales para no alterar controles ni formularios; no se trasladan esos eventos a conversiones de Ads ni se crea otra instalación de analítica.

El aviso de privacidad identifica la etiqueta de Ads como destino de medición actual. La preferencia de analítica se conserva sin activar herramientas. El primer Ok acepta únicamente la medición publicitaria informada en el aviso; la pantalla de preferencias conserva las elecciones independientes y la revocación. ad_personalization sigue denegado. No se amplían permisos ni se activa remarketing.

Se actualizan las versiones de los archivos de privacidad y navegación para evitar que una copia anterior siga esperando al contenedor retirado. Se mantienen las fórmulas, la presentación del sitio, el registro CRM, el acceso a la proyección y las campañas de Google Ads.

## Validación

Las pruebas comprueban el snippet de Ads idéntico y único en las cuatro páginas, ausencia de referencias al contenedor y al destino anterior en todos los archivos activos, consentimiento y revocación, navegación con parámetros seguros y conservación del contenido principal. Las notas históricas del repositorio y las pruebas no constituyen instalaciones activas ni se reescribe el historial de GitHub.

Este cambio se prepara en PR. No está publicado hasta la aprobación del propietario. La verificación de producción comprobará la ausencia de cargas del contenedor y la presencia de la etiqueta AW autorizada después del despliegue.

Resultados: 107 comprobaciones del snippet y del contenido conservado, 23 del consentimiento, 15 de su interfaz, 86 de atribución y 6 de navegación, todas aprobadas. El análisis de los 29 archivos activos no encuentra referencias al contenedor o al destino de analítica retirado. La navegación con identificadores publicitarios se probó con y sin permiso en dos casos. En la vista previa local se comprobó el primer Ok, reapertura de preferencias y revocación; las solicitudes reales a Google estaban desactivadas.
