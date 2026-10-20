# Aviso por etapas: confirmaciones y seguimiento operativo

Versión preparada el 19 de octubre de 2026 para revisión final y merge del PR #9. El propietario identificó su CRM y el flujo de contratación y confirmó el proceso del punto 3, incluido el plazo de 12 meses y la atención de solicitudes. Esa confirmación se toma como aprobación del procedimiento y criterio de conservación. No se presenta como auditoría técnica del CRM ni como revisión legal externa realizada por esta tarea.

## Hechos y decisiones confirmados

| Tema | Confirmación |
|---|---|
| Responsable | Gerardo López España, persona física; nombre profesional Gerardo España |
| Domicilio y correo | Los confirmados en el aviso; gerardoespanaa@gmail.com |
| Visita al sitio | Simulador local, sin creación automática de un expediente |
| Primer contacto | Normalmente WhatsApp; atención personal |
| Evaluación | Tras interés y aceptación de sesión: edad, ocupación, ingresos aproximados, capacidad de ahorro, aportación deseada, retiro objetivo y objetivos financieros, según el caso |
| Registro | Aplicación CRM propia alojada en Lovable |
| Contratación | Gerardo gestiona con el cliente la contratación y firma mediante Allianz DAF; recibe e incorpora al trámite los datos y documentos del cliente |
| Destinataria | Allianz México, S.A., Compañía de Seguros, para el producto solicitado |
| Publicidad | No se enviará inicialmente; no se convierte la cita en autorización promocional |
| Conservación sin contratación | 12 meses desde el último contacto; criterio aprobado por el propietario, con revisión de obligaciones y supuestos de conservación o bloqueo |
| Atención ARCO y revocación | Procedimiento por correo a cargo del responsable, aprobado por el propietario |

El aviso público ya no contiene campos pendientes, marcas de borrador ni `noindex`. Su vigencia se vincula a la publicación. No se ha fusionado ni publicado desde esta tarea.

## Aplicación manual del procedimiento aprobado

El propietario debe aplicar y documentar el procedimiento en su operación. La rama no modifica Lovable, el CRM, WhatsApp ni Allianz DAF y no crea automatizaciones.

1. Facilitar el aviso antes de recopilar o incorporar datos de evaluación. Los enlaces en pie y diálogo de contacto ya existen; usar también el enlace en la invitación o al comenzar la sesión.
2. Obtener y registrar la autorización aplicable a la evaluación, diferenciada de aceptar la cita. Conservar versión del aviso, fecha y alcance de la respuesta en el sistema que utilice el responsable. No se ha creado un formulario ni un registro de consentimiento en esta tarea.
3. Solicitar solo la información pertinente. En contratación, presentar los documentos y avisos aplicables de Allianz y obtener las autorizaciones correspondientes antes de datos adicionales o sensibles.
4. Atender solicitudes por correo: registro, acreditación de identidad, búsqueda en el CRM y copias, determinación, respuesta, ejecución y constancia. El aviso no ofrece un portal o proceso automático.
5. Revisar vencimientos de prospectos sin contratación con el criterio de 12 meses. Considerar copias, exportaciones, correo, mensajes y respaldos bajo control del responsable, y documentar cualquier conservación o bloqueo justificado.

El criterio de conservación no equivale a que Lovable u otra plataforma borre automáticamente. No se ejecutó un borrado de registros ni se comprobó una función de eliminación del CRM. No se atribuyen al sistema regiones, bases de datos, cifrado o capacidades no confirmadas.

## Textos de apoyo para el flujo

Utilizar el enlace cuando la versión del aviso esté publicada. Estas plantillas no se enviaron a prospectos desde la tarea.

**Antes de pedir datos para evaluación:**

> Para preparar tu evaluación necesito información sobre tu situación y objetivos. Antes de compartirla, revisa el aviso de privacidad: https://gerardoespanaa-bit.github.io/Landing/aviso-de-privacidad.html. Te explicaré cuáles son los datos necesarios para tu caso y cómo se registran. La autorización para ese tratamiento es distinta de aceptar la cita.

**Ejemplo para registrar una autorización específica:**

> He consultado el aviso de privacidad de fecha 19 de octubre de 2026. Autorizo expresamente a Gerardo López España a recopilar y registrar los datos financieros o patrimoniales pertinentes que proporcione para mi evaluación y propuesta de solución financiera, en los términos de ese aviso. Esta autorización no incluye publicidad ni equivale a contratar un PPR.

Ajustar el texto al canal y datos del caso, y guardar la respuesta real. No usar un clic de WhatsApp, una cita o la aceptación de cookies como prueba de esa autorización. La firma de contratación en Allianz DAF pertenece a una etapa distinta.

## Fuentes y alcance

Las prácticas del CRM y Allianz DAF provienen de las confirmaciones del propietario. Se enlazan los [avisos oficiales de Allianz](https://www.allianz.com.mx/legales/legales-mexico/legales-allianz.html) y la [política de Lovable](https://lovable.dev/privacy); no se deduce la configuración particular del CRM de la publicidad del proveedor.

La referencia normativa es la [LFPDPPP vigente](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf), incluidos consentimiento, información previa y derechos ARCO. La redacción no declara una certificación jurídica, técnica o de seguridad del negocio o de sus sistemas.

## GA4: siguiente fase separada

GTM ya carga desde la landing, pero GA4, los eventos y las preferencias preparadas continúan desactivados. Los IDs reales ya fueron recibidos. No se cambian `measurement-config.js`, `measurement.js`, el HTML de la landing ni la restricción de etiquetas en este PR.

Activar analítica requiere unificar el cargador, conectar la elección del visitante, revisar la ruta sin JavaScript y configurar y comprobar el contenedor y GA4 con Tag Assistant y DebugView. Aprobar la política de atención de prospectos no otorga consentimiento analítico a los visitantes. No añadir a eventos mensajes, teléfonos, URLs de WhatsApp ni valores financieros.

El merge de este PR publicará el aviso actualizado. No activará GA4, no modificará el simulador y no automatizará la operación del CRM.
