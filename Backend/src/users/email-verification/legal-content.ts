export interface LegalEmailContentParams {
    friendlyName: string;
    privacyUrl: string;
    termsUrl: string;
}

export interface LegalEmailContent {
    html: string;
    text: string;
}

export function buildLegalEmailContent(params: LegalEmailContentParams): LegalEmailContent {
    const { friendlyName, privacyUrl, termsUrl } = params;

    const html = `
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 720px; margin: 0 auto; padding: 24px; color: #111827; background-color: #ffffff;">
            <p style="margin: 0 0 16px; font-size: 16px;">Hola ${friendlyName},</p>
            <p style="margin: 0 0 16px; font-size: 16px;">Gracias por registrarte en <strong>FilaCero</strong>. Incluimos el contenido completo de nuestros Términos de Servicio y Política de Privacidad para que puedas consultarlos con calma. También puedes revisarlos en línea:</p>
            <ul style="margin: 0 0 24px 20px; padding: 0; font-size: 15px; color: #2563EB;">
                <li style="margin-bottom: 8px;"><a href="${termsUrl}" style="color: #2563EB; text-decoration: none;">Términos de Servicio</a></li>
                <li><a href="${privacyUrl}" style="color: #2563EB; text-decoration: none;">Política de Privacidad</a></li>
            </ul>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
            <h2 style="font-size: 20px; margin: 0 0 12px;">Términos de Servicio</h2>
            <p style="margin: 0 0 12px; font-size: 14px; color: #6B7280;">Actualizado: 22 septiembre 2025</p>
            <p style="margin: 0 0 16px; font-size: 15px;">Estos Términos de Servicio ("Términos") regulan el uso de la plataforma FilaCero ("Servicio"). Al crear una cuenta o utilizar el Servicio aceptas estos Términos.</p>
            <h3 style="font-size: 16px; margin: 24px 0 8px;">1. Definiciones</h3>
            <p style="margin: 0 0 16px; font-size: 15px;"><strong>"Cliente"</strong>: Institución, escuela o entidad que crea la cuenta. <strong>"Usuarios finales"</strong>: Personas que realizan pedidos o interactúan con el catálogo. <strong>"Contenido"</strong>: Información, datos, menús, imágenes o materiales cargados al Servicio.</p>
            <h3 style="font-size: 16px; margin: 24px 0 8px;">2. Uso del Servicio</h3>
            <ul style="margin: 0 0 16px 20px; padding: 0; font-size: 15px; list-style-type: disc;">
                <li style="margin-bottom: 6px;">Debes proporcionar información veraz y mantener la seguridad de las credenciales.</li>
                <li style="margin-bottom: 6px;">No puedes usar el Servicio para actividades ilegales o que violen derechos de terceros.</li>
                <li>Podemos suspender cuentas que abusen, vulneren seguridad o incumplan estos Términos.</li>
            </ul>
            <h3 style="font-size: 16px; margin: 24px 0 8px;">3. Propiedad Intelectual</h3>
            <p style="margin: 0 0 16px; font-size: 15px;">FilaCero mantiene todos los derechos sobre el software, marca y elementos asociados. El Contenido cargado por el Cliente sigue siendo de su titularidad; concedes una licencia limitada para su procesamiento y visualización.</p>
            <h3 style="font-size: 16px; margin: 24px 0 8px;">4. Planes y Cambios</h3>
            <p style="margin: 0 0 16px; font-size: 15px;">Los planes gratuitos o de pago pueden ajustarse con aviso razonable. Cualquier cambio sustancial será comunicado a través del panel o correo.</p>
            <h3 style="font-size: 16px; margin: 24px 0 8px;">5. Disponibilidad</h3>
            <p style="margin: 0 0 16px; font-size: 15px;">Trabajamos para mantener alta disponibilidad, pero el Servicio se ofrece "tal cual" sin garantías absolutas. Podremos realizar mantenimientos planificados.</p>
            <h3 style="font-size: 16px; margin: 24px 0 8px;">6. Limitación de Responsabilidad</h3>
            <p style="margin: 0 0 16px; font-size: 15px;">No somos responsables de pérdidas indirectas (lucro cesante, daños reputacionales) derivadas del uso o imposibilidad de uso del Servicio en la medida permitida por ley.</p>
            <h3 style="font-size: 16px; margin: 24px 0 8px;">7. Terminación</h3>
            <p style="margin: 0 0 16px; font-size: 15px;">Puedes cerrar tu cuenta cuando lo desees. Podremos terminar o suspender acceso por incumplimientos. Podremos eliminar datos tras un periodo razonable tras la terminación.</p>
            <h3 style="font-size: 16px; margin: 24px 0 8px;">8. Modificaciones</h3>
            <p style="margin: 0 0 16px; font-size: 15px;">Podremos actualizar estos Términos. Si el cambio es material, intentaremos notificar con antelación. El uso continuado implica aceptación de los nuevos Términos.</p>
            <h3 style="font-size: 16px; margin: 24px 0 8px;">9. Contacto</h3>
            <p style="margin: 0 0 16px; font-size: 15px;">Para dudas legales o solicitudes escríbenos a <a href="mailto:legal@filacero.app" style="color: #2563EB; text-decoration: none;">legal@filacero.app</a>.</p>
            <p style="margin: 24px 0 32px; font-size: 12px; color: #6B7280;">Este documento es una versión inicial de referencia y no constituye asesoría legal. Se recomienda revisión jurídica profesional antes del lanzamiento comercial.</p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
            <h2 style="font-size: 20px; margin: 0 0 12px;">Política de Privacidad</h2>
            <p style="margin: 0 0 12px; font-size: 14px; color: #6B7280;">Actualizado: 22 septiembre 2025</p>
            <p style="margin: 0 0 16px; font-size: 15px;">Esta Política describe cómo FilaCero ("nosotros") recopila, utiliza y protege datos relacionados con el uso del Servicio.</p>
            <h3 style="font-size: 16px; margin: 24px 0 8px;">1. Datos que Recopilamos</h3>
            <ul style="margin: 0 0 16px 20px; padding: 0; font-size: 15px; list-style-type: disc;">
                <li style="margin-bottom: 6px;"><strong>Cuenta:</strong> nombre, email institucional y metadatos operativos.</li>
                <li style="margin-bottom: 6px;"><strong>Operación:</strong> productos, categorías, pedidos y métricas de uso.</li>
                <li><strong>Uso técnico:</strong> logs de acceso, tipo de dispositivo y eventos para diagnóstico.</li>
            </ul>
            <h3 style="font-size: 16px; margin: 24px 0 8px;">2. Finalidades</h3>
            <ul style="margin: 0 0 16px 20px; padding: 0; font-size: 15px; list-style-type: disc;">
                <li style="margin-bottom: 6px;">Proveer y mantener el Servicio.</li>
                <li style="margin-bottom: 6px;">Mejorar rendimiento y experiencia.</li>
                <li style="margin-bottom: 6px;">Generar reportes agregados internos.</li>
                <li>Comunicar cambios relevantes o incidencias.</li>
            </ul>
            <h3 style="font-size: 16px; margin: 24px 0 8px;">3. Base Legal (si aplica GDPR)</h3>
            <ul style="margin: 0 0 16px 20px; padding: 0; font-size: 15px; list-style-type: disc;">
                <li style="margin-bottom: 6px;">Ejecución de contrato (provisión del Servicio).</li>
                <li style="margin-bottom: 6px;">Interés legítimo (mejora y seguridad).</li>
                <li>Consentimiento (comunicaciones opcionales, cuando proceda).</li>
            </ul>
            <h3 style="font-size: 16px; margin: 24px 0 8px;">4. Almacenamiento y Seguridad</h3>
            <p style="margin: 0 0 16px; font-size: 15px;">Se aplican medidas razonables de seguridad (cifrado en tránsito, controles de acceso, backups periódicos). Ningún sistema es 100% infalible, pero seguimos buenas prácticas para mitigar riesgos.</p>
            <h3 style="font-size: 16px; margin: 24px 0 8px;">5. Retención</h3>
            <p style="margin: 0 0 16px; font-size: 15px;">Conservamos datos mientras la cuenta esté activa y durante un periodo razonable posterior para soporte o auditoría mínima, salvo solicitud de eliminación.</p>
            <h3 style="font-size: 16px; margin: 24px 0 8px;">6. Derechos del Usuario (cuando corresponda)</h3>
            <ul style="margin: 0 0 16px 20px; padding: 0; font-size: 15px; list-style-type: disc;">
                <li style="margin-bottom: 6px;">Acceso, rectificación o portabilidad.</li>
                <li style="margin-bottom: 6px;">Eliminación en la medida legalmente permitida.</li>
                <li>Oposición o limitación a ciertos tratamientos.</li>
            </ul>
            <h3 style="font-size: 16px; margin: 24px 0 8px;">7. Subencargados y Transferencias</h3>
            <p style="margin: 0 0 16px; font-size: 15px;">Podemos usar proveedores de infraestructura o analítica. Seleccionamos proveedores con estándares aceptables de seguridad y privacidad. Cualquier transferencia internacional se realizará con mecanismos adecuados.</p>
            <h3 style="font-size: 16px; margin: 24px 0 8px;">8. Cookies / Tecnologías Similares</h3>
            <p style="margin: 0 0 16px; font-size: 15px;">Podemos usar almacenamiento local y cookies técnicas para sesión y preferencias. No empleamos cookies de publicidad en esta fase inicial.</p>
            <h3 style="font-size: 16px; margin: 24px 0 8px;">9. Cambios a esta Política</h3>
            <p style="margin: 0 0 16px; font-size: 15px;">Podremos actualizar la Política. Publicaremos la versión revisada con fecha de actualización. Cambios materiales se comunicarán por correo o panel.</p>
            <h3 style="font-size: 16px; margin: 24px 0 8px;">10. Contacto</h3>
            <p style="margin: 0 0 16px; font-size: 15px;">Para ejercer derechos o dudas de privacidad: <a href="mailto:privacy@filacero.app" style="color: #2563EB; text-decoration: none;">privacy@filacero.app</a>.</p>
            <p style="margin: 24px 0 0; font-size: 12px; color: #6B7280;">Esta Política es preliminar y deberá revisarse por asesoría legal especializada antes del escalado comercial.</p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 32px 0;" />
            <p style="margin: 0; font-size: 14px; color: #6B7280;">Si necesitas ayuda, responde a este correo y el equipo de privacidad te apoyará.</p>
            <p style="margin: 24px 0 0; font-size: 14px;">— Equipo de Privacidad FilaCero</p>
        </div>
    `;

    const text = [
        `Hola ${friendlyName},`,
        '',
        'Gracias por registrarte en FilaCero. A continuación encontrarás el contenido íntegro de nuestros Términos de Servicio y Política de Privacidad. También puedes consultarlos en línea:',
        `- Términos: ${termsUrl}`,
        `- Privacidad: ${privacyUrl}`,
        '',
        '================ Términos de Servicio (Actualizado: 22 septiembre 2025) ================',
        'Estos Términos de Servicio (“Términos”) regulan el uso de la plataforma FilaCero (“Servicio”). Al crear una cuenta o utilizar el Servicio aceptas estos Términos.',
        '',
        '1. Definiciones',
        '"Cliente": Institución, escuela o entidad que crea la cuenta.',
        '"Usuarios finales": Personas que realizan pedidos o interactúan con el catálogo.',
        '"Contenido": Información, datos, menús, imágenes o materiales cargados al Servicio.',
        '',
        '2. Uso del Servicio',
        '- Debes proporcionar información veraz y mantener la seguridad de las credenciales.',
        '- No puedes usar el Servicio para actividades ilegales o que violen derechos de terceros.',
        '- Podemos suspender cuentas que abusen, vulneren seguridad o incumplan estos Términos.',
        '',
        '3. Propiedad Intelectual',
        'FilaCero mantiene todos los derechos sobre el software, marca y elementos asociados. El Contenido cargado por el Cliente sigue siendo de su titularidad; concedes una licencia limitada para su procesamiento y visualización.',
        '',
        '4. Planes y Cambios',
        'Los planes gratuitos o de pago pueden ajustarse con aviso razonable. Cualquier cambio sustancial será comunicado a través del panel o correo.',
        '',
        '5. Disponibilidad',
        'Trabajamos para mantener alta disponibilidad, pero el Servicio se ofrece “tal cual” sin garantías absolutas. Podremos realizar mantenimientos planificados.',
        '',
        '6. Limitación de Responsabilidad',
        'No somos responsables de pérdidas indirectas (lucro cesante, daños reputacionales) derivadas del uso o imposibilidad de uso del Servicio en la medida permitida por ley.',
        '',
        '7. Terminación',
        'Puedes cerrar tu cuenta cuando lo desees. Podremos terminar o suspender acceso por incumplimientos. Podremos eliminar datos tras un periodo razonable tras la terminación.',
        '',
        '8. Modificaciones',
        'Podremos actualizar estos Términos. Si el cambio es material, intentaremos notificar con antelación. El uso continuado implica aceptación de los nuevos Términos.',
        '',
        '9. Contacto',
        'Para dudas legales o solicitudes escríbenos a legal@filacero.app.',
        '',
        'Nota: Este documento es una versión inicial de referencia y no constituye asesoría legal. Se recomienda revisión jurídica profesional antes del lanzamiento comercial.',
        '',
        '================ Política de Privacidad (Actualizado: 22 septiembre 2025) ================',
        'Esta Política describe cómo FilaCero (“nosotros”) recopila, utiliza y protege datos relacionados con el uso del Servicio.',
        '',
        '1. Datos que Recopilamos',
        '- Cuenta: nombre, email institucional y metadatos operativos.',
        '- Operación: productos, categorías, pedidos y métricas de uso.',
        '- Uso técnico: logs de acceso, tipo de dispositivo y eventos para diagnóstico.',
        '',
        '2. Finalidades',
        '- Proveer y mantener el Servicio.',
        '- Mejorar rendimiento y experiencia.',
        '- Generar reportes agregados internos.',
        '- Comunicar cambios relevantes o incidencias.',
        '',
        '3. Base Legal (si aplica GDPR)',
        '- Ejecución de contrato (provisión del Servicio).',
        '- Interés legítimo (mejora y seguridad).',
        '- Consentimiento (comunicaciones opcionales, cuando proceda).',
        '',
        '4. Almacenamiento y Seguridad',
        'Se aplican medidas razonables de seguridad (cifrado en tránsito, controles de acceso, backups periódicos).',
        '',
        '5. Retención',
        'Conservamos datos mientras la cuenta esté activa y durante un periodo razonable posterior, salvo solicitud de eliminación.',
        '',
        '6. Derechos del Usuario (cuando corresponda)',
        '- Acceso, rectificación o portabilidad.',
        '- Eliminación en la medida legalmente permitida.',
        '- Oposición o limitación a ciertos tratamientos.',
        '',
        '7. Subencargados y Transferencias',
        'Podemos usar proveedores de infraestructura o analítica, seleccionados con estándares adecuados. Cualquier transferencia internacional se realizará con mecanismos adecuados.',
        '',
        '8. Cookies / Tecnologías Similares',
        'Podemos usar almacenamiento local y cookies técnicas para sesión y preferencias. No empleamos cookies de publicidad en esta fase inicial.',
        '',
        '9. Cambios a esta Política',
        'Podremos actualizar la Política. Publicaremos la versión revisada con fecha de actualización. Cambios materiales se comunicarán por correo o panel.',
        '',
        '10. Contacto',
        'Para ejercer derechos o dudas de privacidad: privacy@filacero.app.',
        '',
        'Nota: Esta Política es preliminar y deberá revisarse por asesoría legal especializada antes del escalado comercial.',
        '',
        'Si necesitas ayuda, responde a este correo y el equipo de privacidad te apoyará.',
        '',
        '— Equipo de Privacidad FilaCero'
    ].join('\n');

    return { html, text };
}
