export const CORPORATE_LANDING_URL = (
  import.meta.env.VITE_CORPORATE_URL || 'https://expertedu.fournext.website'
).replace(/\/+$/, '');

export interface LegalSection {
  title: string;
  paragraphs: string[];
}

export const TERMS_SECTIONS: LegalSection[] = [
  {
    title: '1. Objeto y alcance',
    paragraphs: [
      'Los presentes Términos y Condiciones regulan el acceso y uso de la plataforma educativa ExpertEdu Studio y del sitio corporativo de ExpertEdu Solutions S.R.L. Al ingresar o utilizar cualquiera de sus módulos, el usuario acepta estas condiciones.',
    ],
  },
  {
    title: '2. Finalidad pedagógica de la plataforma',
    paragraphs: [
      'ExpertEdu Studio es una plataforma educativa destinada a apoyar la enseñanza y el aprendizaje de Sistemas Expertos mediante herramientas interactivas para la creación, edición, ejecución, simulación y validación de bases de conocimiento.',
      'La plataforma constituye un recurso de apoyo pedagógico y tecnológico; en ningún caso sustituye la orientación, supervisión académica ni evaluación realizada por un docente.',
    ],
  },
  {
    title: '3. Responsabilidades del docente y de la institución',
    paragraphs: [
      'El docente es responsable de supervisar los contenidos académicos, configurar las actividades formativas, verificar la coherencia técnica de las bases de conocimiento utilizadas y revisar los resultados obtenidos por los estudiantes.',
      'Todas las decisiones relacionadas con la publicación de actividades, la aceptación de soluciones y la asignación de calificaciones permanecen bajo criterio y responsabilidad exclusiva del docente o de la institución educativa.',
    ],
  },
  {
    title: '4. Uso de asistencia mediante inteligencia artificial',
    paragraphs: [
      'ExpertEdu Studio puede incorporar funciones de asistencia mediante inteligencia artificial orientadas a sugerir hechos, variables, reglas de producción, ejemplos y explicaciones del razonamiento lógico.',
      'Los contenidos generados automáticamente pueden presentar errores, omisiones o imprecisiones. Por ello, deben considerarse propuestas de apoyo sujetas a revisión y validación humana antes de incorporarse a una base de conocimiento o emplearse en actividades académicas.',
    ],
  },
  {
    title: '5. Resultados del motor de inferencia',
    paragraphs: [
      'El motor de inferencia procesa los hechos iniciales y las reglas definidas en cada base de conocimiento conforme a los mecanismos implementados en la plataforma. La validez de las conclusiones obtenidas depende de la correcta formulación de las reglas, la integridad de los hechos ingresados y la consistencia lógica de la base de conocimiento.',
      'La ejecución técnica satisfactoria de un sistema experto no implica necesariamente que sus conocimientos o conclusiones sean válidos respecto al dominio real representado sin una revisión experta previa.',
    ],
  },
  {
    title: '6. Uso responsable, integridad académica y seguridad',
    paragraphs: [
      'Los usuarios deben emplear la plataforma exclusivamente para fines lícitos y actividades autorizadas, respetando la integridad de los contenidos, evaluaciones y recursos académicos.',
      'Queda prohibida la manipulación no autorizada de evaluaciones, la suplantación de identidad y cualquier actividad destinada a comprometer la seguridad, confidencialidad o disponibilidad del servicio.',
    ],
  },
  {
    title: '7. Propiedad intelectual',
    paragraphs: [
      'La marca ExpertEdu, el código fuente y la plataforma ExpertEdu Studio pertenecen a ExpertEdu Solutions S.R.L. Los materiales académicos y bases de conocimiento elaborados por docentes o instituciones conservan la titularidad de sus autores conforme a los acuerdos aplicables.',
    ],
  },
  {
    title: '8. Privacidad y protección de información académica',
    paragraphs: [
      'El tratamiento de los datos personales y académicos se rige por la Política de Privacidad de ExpertEdu Solutions S.R.L., donde se detallan las finalidades, medidas de seguridad, uso de servicios externos de IA y mecanismos para ejercer derechos.',
    ],
  },
  {
    title: '9. Contacto y actualizaciones',
    paragraphs: [
      'Para consultas comerciales o institucionales escribe a contacto@expertedu.bo, y para asistencia técnica a soporte@expertedu.bo. ExpertEdu Solutions S.R.L. podrá actualizar estos lineamientos para reflejar mejoras técnicas o normativas.',
    ],
  },
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: '1. Responsable del tratamiento',
    paragraphs: [
      'El responsable del tratamiento de los datos recopilados en ExpertEdu Studio y en el sitio corporativo es ExpertEdu Solutions S.R.L., con domicilio operativo en Santa Cruz de la Sierra, Bolivia.',
    ],
  },
  {
    title: '2. Datos recopilados',
    paragraphs: [
      'Se recopilan los datos necesarios para la autenticación y operación académica (nombre completo, nombre de usuario, correo electrónico institucional o personal, rol docente/estudiante, cursos, actividades y bases de conocimiento elaboradas dentro de la plataforma).',
      'Los datos comerciales y de soporte enviados desde la web corporativa se gestionan en una base de datos independiente de la plataforma educativa.',
    ],
  },
  {
    title: '3. Finalidades del tratamiento y destinatarios',
    paragraphs: [
      'Los datos se utilizan exclusivamente para autenticar el acceso, proveer las herramientas educativas contratadas o autorizadas, permitir el seguimiento docente de actividades, gestionar soporte técnico y proteger la seguridad del servicio.',
      'ExpertEdu Solutions S.R.L. no vende, alquila ni cede datos personales o académicos a terceros con fines publicitarios.',
    ],
  },
  {
    title: '4. Servicios externos de inteligencia artificial',
    paragraphs: [
      'Cuando una funcionalidad de asistencia mediante inteligencia artificial requiera procesar consultas a través de proveedores externos de modelos de lenguaje, el envío se limita al contexto técnico o académico necesario para generar la sugerencia o explicación solicitada.',
      'Se recomienda a docentes y estudiantes evitar incluir datos personales sensibles dentro de prompts, reglas o ejemplos académicos.',
    ],
  },
  {
    title: '5. Períodos de conservación',
    paragraphs: [
      'Los datos académicos y registros de actividad se conservan durante la vigencia del curso, cuenta o convenio institucional correspondiente, y posteriormente son eliminados o anonimizados de forma segura.',
    ],
  },
  {
    title: '6. Medidas de seguridad técnica',
    paragraphs: [
      'Aplicamos validación estricta de entradas, cifrado en tránsito mediante HTTPS/TLS en producción, autenticación JWT, control granular de permisos por rol (Docente / Estudiante / Administrador) y aislamiento entre la base corporativa y la plataforma educativa.',
    ],
  },
  {
    title: '7. Derechos del usuario y contacto',
    paragraphs: [
      'Puedes solicitar en cualquier momento acceso, rectificación, actualización o eliminación de tus registros escribiendo a contacto@expertedu.bo o a soporte@expertedu.bo.',
    ],
  },
];
