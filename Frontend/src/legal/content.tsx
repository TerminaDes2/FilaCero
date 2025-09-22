// Centralized legal content definitions for Terms and Privacy.
// Each section includes an id (used for anchors), title, and React children body.
// This allows reuse between standalone pages and an in-app modal.
import React from 'react';

export interface LegalSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

export interface LegalDocument {
  slug: 'terminos' | 'privacidad';
  label: string;
  updated: string; // ISO or human date string
  intro: React.ReactNode;
  sections: LegalSection[];
  disclaimer: React.ReactNode;
}

export const terminos: LegalDocument = {
  slug: 'terminos',
  label: 'Términos de Servicio',
  updated: '22 septiembre 2025',
  intro: (
    <p>Estos Términos de Servicio ("Términos") regulan el uso de la plataforma FilaCero ("Servicio"). Al crear una cuenta o utilizar el Servicio aceptas estos Términos.</p>
  ),
  sections: [
    {
      id: 'definiciones',
      title: '1. Definiciones',
      body: (
        <p><strong>"Cliente"</strong>: Institución, escuela o entidad que crea la cuenta. <strong>"Usuarios finales"</strong>: Personas que realizan pedidos o interactúan con el catálogo. <strong>"Contenido"</strong>: Información, datos, menús, imágenes o materiales cargados al Servicio.</p>
      )
    },
    {
      id: 'uso',
      title: '2. Uso del Servicio',
      body: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Debes proporcionar información veraz y mantener la seguridad de las credenciales.</li>
          <li>No puedes usar el Servicio para actividades ilegales o que violen derechos de terceros.</li>
          <li>Podemos suspender cuentas que abusen, vulneren seguridad o incumplan estos Términos.</li>
        </ul>
      )
    },
    {
      id: 'propiedad',
      title: '3. Propiedad Intelectual',
      body: (
        <p>FilaCero mantiene todos los derechos sobre el software, marca y elementos asociados. El Contenido cargado por el Cliente sigue siendo de su titularidad; concedes una licencia limitada para su procesamiento y visualización.</p>
      )
    },
    {
      id: 'planes',
      title: '4. Planes y Cambios',
      body: (
        <p>Los planes gratuitos o de pago pueden ajustarse con aviso razonable. Cualquier cambio sustancial será comunicado a través del panel o correo.</p>
      )
    },
    {
      id: 'disponibilidad',
      title: '5. Disponibilidad',
      body: (
        <p>Trabajamos para mantener alta disponibilidad, pero el Servicio se ofrece "tal cual" sin garantías absolutas. Podremos realizar mantenimientos planificados.</p>
      )
    },
    {
      id: 'limitacion',
      title: '6. Limitación de Responsabilidad',
      body: (
        <p>No somos responsables de pérdidas indirectas (lucro cesante, daños reputacionales) derivadas del uso o imposibilidad de uso del Servicio en la medida permitida por ley.</p>
      )
    },
    {
      id: 'terminacion',
      title: '7. Terminación',
      body: (
        <p>Puedes cerrar tu cuenta cuando lo desees. Podremos terminar o suspender acceso por incumplimientos. Podremos eliminar datos tras un periodo razonable tras la terminación.</p>
      )
    },
    {
      id: 'modificaciones',
      title: '8. Modificaciones',
      body: (
        <p>Podremos actualizar estos Términos. Si el cambio es material, intentaremos notificar con antelación. El uso continuado implica aceptación de los nuevos Términos.</p>
      )
    },
    {
      id: 'contacto',
      title: '9. Contacto',
      body: (
        <p>Para dudas legales o solicitudes escríbenos a <a href="mailto:legal@filacero.app" className="text-brand-600 dark:text-brand-400 underline">legal@filacero.app</a>.</p>
      )
    }
  ],
  disclaimer: (
    <p className="text-xs text-gray-500 dark:text-slate-500">Este documento es una versión inicial de referencia y no constituye asesoría legal. Se recomienda revisión jurídica profesional antes del lanzamiento comercial.</p>
  )
};

export const privacidad: LegalDocument = {
  slug: 'privacidad',
  label: 'Política de Privacidad',
  updated: '22 septiembre 2025',
  intro: (
    <p>Esta Política describe cómo FilaCero ("nosotros") recopila, utiliza y protege datos relacionados con el uso del Servicio.</p>
  ),
  sections: [
    {
      id: 'datos',
      title: '1. Datos que Recopilamos',
      body: (
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Cuenta:</strong> nombre, email institucional y metadatos operativos.</li>
          <li><strong>Operación:</strong> productos, categorías, pedidos y métricas de uso.</li>
          <li><strong>Uso técnico:</strong> logs de acceso, tipo de dispositivo y eventos para diagnóstico.</li>
        </ul>
      )
    },
    {
      id: 'finalidades',
      title: '2. Finalidades',
      body: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Proveer y mantener el Servicio.</li>
          <li>Mejorar rendimiento y experiencia.</li>
          <li>Generar reportes agregados internos.</li>
          <li>Comunicar cambios relevantes o incidencias.</li>
        </ul>
      )
    },
    {
      id: 'base-legal',
      title: '3. Base Legal (si aplica GDPR)',
      body: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Ejecución de contrato (provisión del Servicio).</li>
          <li>Interés legítimo (mejora y seguridad).</li>
          <li>Consentimiento (comunicaciones opcionales, cuando proceda).</li>
        </ul>
      )
    },
    {
      id: 'seguridad',
      title: '4. Almacenamiento y Seguridad',
      body: (
        <p>Se aplican medidas razonables de seguridad (cifrado en tránsito, controles de acceso, backups periódicos). Ningún sistema es 100% infalible, pero seguimos buenas prácticas para mitigar riesgos.</p>
      )
    },
    {
      id: 'retencion',
      title: '5. Retención',
      body: (
        <p>Conservamos datos mientras la cuenta esté activa y durante un periodo razonable posterior para soporte o auditoría mínima, salvo solicitud de eliminación.</p>
      )
    },
    {
      id: 'derechos',
      title: '6. Derechos del Usuario (cuando corresponda)',
      body: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Acceso, rectificación o portabilidad.</li>
          <li>Eliminación en la medida legalmente permitida.</li>
          <li>Oposición o limitación a ciertos tratamientos.</li>
        </ul>
      )
    },
    {
      id: 'subencargados',
      title: '7. Subencargados y Transferencias',
      body: (
        <p>Podemos usar proveedores de infraestructura o analítica. Seleccionamos proveedores con estándares aceptables de seguridad y privacidad. Cualquier transferencia internacional se realizará con mecanismos adecuados.</p>
      )
    },
    {
      id: 'cookies',
      title: '8. Cookies / Tecnologías Similares',
      body: (
        <p>Podemos usar almacenamiento local y cookies técnicas para sesión y preferencias. No empleamos cookies de publicidad en esta fase inicial.</p>
      )
    },
    {
      id: 'cambios',
      title: '9. Cambios a esta Política',
      body: (
        <p>Podremos actualizar la Política. Publicaremos la versión revisada con fecha de actualización. Cambios materiales se comunicarán por correo o panel.</p>
      )
    },
    {
      id: 'contacto',
      title: '10. Contacto',
      body: (
        <p>Para ejercer derechos o dudas de privacidad: <a href="mailto:privacy@filacero.app" className="text-brand-600 dark:text-brand-400 underline">privacy@filacero.app</a>.</p>
      )
    }
  ],
  disclaimer: (
    <p className="text-xs text-gray-500 dark:text-slate-500">Esta Política es preliminar y deberá revisarse por asesoría legal especializada antes del escalado comercial.</p>
  )
};

export const legalDocuments = { terminos, privacidad };
export type LegalSlug = keyof typeof legalDocuments;

export function getLegal(slug: LegalSlug): LegalDocument { return legalDocuments[slug]; }
