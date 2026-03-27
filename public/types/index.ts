export interface Usuario {
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  tipo:
    | 'administrador'
    | 'residente'
    | 'propietario_residente'
    | 'arrendatario'
    | 'propietario_no_residente'
    | 'seguridad'
    | 'consejo'
    | 'comite_convivencia'
    | 'servicios_generales'
    | 'contadora';
  conjuntoId: string;
  unidad?: string;
  torre?: string;
  fechaRegistro: Date;
  activo: boolean;
  consentimientoDatos: boolean;
  seguridadPerfil?: 'control_acceso' | 'incidentes';
}

// ==================== MÓDULO PARQUEADEROS (Decreto 768 de 2025) ====================

export interface Parqueadero {
  id: string;
  conjuntoId: string;
  codigo: string;
  tipo: 'carro' | 'moto' | 'bicicleta';
  categoria: 'propio' | 'comun' | 'visitante';
  ubicacion: string;
  estado: 'disponible' | 'asignado' | 'mantenimiento' | 'inactivo';
  unidadAsignada?: string;
  residenteAsignado?: string;
  vehiculoAsignado?: string;
  fechaAsignacion?: Date;
  observaciones?: string;
  // Campos según Decreto 768/2025
  areaM2?: number;
  tipoConstruccion?: 'cubierto' | 'descubierto' | 'semicubierto';
  tieneServicios?: boolean;
  accesibilidad?: 'directa' | 'indirecta';
}

export interface Vehiculo {
  id: string;
  conjuntoId: string;
  residenteId: string;
  unidadId: string;
  parqueaderoId?: string;
  tipo: 'carro' | 'moto' | 'bicicleta';
  placa?: string;
  marca?: string;
  modelo?: string;
  color?: string;
  anio?: number;
  foto?: string;
  soatVencimiento?: Date;
  tecnomecanicaVencimiento?: Date;
  tarjetaPropiedad?: string;
  activo: boolean;
  fechaRegistro: Date;
  observaciones?: string;
}

export interface AsignacionParqueadero {
  id: string;
  parqueaderoId: string;
  vehiculoId: string;
  residenteId: string;
  unidadId: string;
  fechaInicio: Date;
  fechaFin?: Date;
  tipoAsignacion: 'propiedad' | 'arrendamiento' | 'comodato' | 'temporal';
  valorCuota?: number;
  estado: 'activa' | 'suspendida' | 'terminada';
  documentoSoporte?: string;
  observaciones?: string;
}

export interface EstadisticaParqueaderos {
  totalCarros: number;
  totalMotos: number;
  totalBicicletas: number;
  ocupadosCarros: number;
  ocupadosMotos: number;
  ocupadosBicicletas: number;
  disponiblesCarros: number;
  disponiblesMotos: number;
  disponiblesBicicletas: number;
  porcentajeOcupacion: number;
  ingresosPorParqueaderos: number;
}

// ==================== MÓDULO CENSO ANIMALES DE COMPAÑÍA (Decreto 768 de 2025) ====================

export interface CertificadoVacunacion {
  id: string;
  tipoVacuna: string;
  fechaAplicacion: Date;
  fechaVencimiento: Date;
  archivoUrl?: string;
  archivoNombre?: string;
  veterinario?: string;
  observaciones?: string;
}

export interface Microchip {
  numero: string;
  fechaImplantacion: Date;
  veterinario?: string;
  observaciones?: string;
}

export interface PolizaResponsabilidadCivil {
  numero: string;
  aseguradora: string;
  fechaInicio: Date;
  fechaVencimiento: Date;
  archivoUrl?: string;
  archivoNombre?: string;
  requerida: boolean;
  observaciones?: string;
}

export interface AnimalCompania {
  id: string;
  conjuntoId: string;
  unidadId: string;
  residenteId: string;
  nombre: string;
  raza: string;
  caracteristicasFisicas: string;
  tipo: 'perro' | 'gato' | 'otro';
  especie?: string;
  fechaNacimiento?: Date;
  sexo: 'macho' | 'hembra';
  microchip?: Microchip;
  certificadosVacunacion: CertificadoVacunacion[];
  polizaResponsabilidadCivil?: PolizaResponsabilidadCivil;
  foto?: string;
  observaciones?: string;
  fechaRegistro: Date;
  activo: boolean;
}

export interface EstadisticaAnimales {
  totalAnimales: number;
  totalPerros: number;
  totalGatos: number;
  totalOtros: number;
  animalesConMicrochip: number;
  animalesConPoliza: number;
  certificadosVencidos: number;
  certificadosPorVencer: number;
  polizasVencidas: number;
  polizasPorVencer: number;
  animalesPorUnidad: { [unidadId: string]: number };
}

// Lista predefinida de razas de manejo especial según normativa colombiana
export const RAZAS_MANEJO_ESPECIAL = [
  'Pitbull Terrier',
  'American Pitbull Terrier',
  'Staffordshire Bull Terrier',
  'American Staffordshire Terrier',
  'Rottweiler',
  'Doberman',
  'Pastor Alemán',
  'Bull Terrier',
  'Bullmastiff',
  'Mastín Napolitano',
  'Fila Brasileño',
  'Tosa Inu',
  'Akita Inu',
  'Dogo Argentino',
  'Dogo de Burdeos',
  'Mastín del Pirineo',
  'Pres Canario',
  'Doberman Pinscher'
];

// ==================== MÓDULO SERVICIOS GENERALES ====================

export interface NovedadServicios {
  id: string;
  conjuntoId: string;
  reportadoPor: string;
  tipo: 'limpieza' | 'jardineria' | 'mantenimiento' | 'seguridad' | 'otro';
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  descripcion: string;
  ubicacion: string;
  fechaReporte: Date;
  estado: 'reportada' | 'en_proceso' | 'resuelta' | 'cerrada';
  asignadoA?: string;
  fechaResolucion?: Date;
  evidencias?: string[];
  respuesta?: string;
}

export interface SolicitudImplementos {
  id: string;
  conjuntoId: string;
  solicitadoPor: string;
  tipo: 'limpieza' | 'jardineria' | 'mantenimiento' | 'oficina' | 'seguridad' | 'otro';
  items: ItemSolicitud[];
  justificacion: string;
  urgencia: 'baja' | 'media' | 'alta';
  fechaSolicitud: Date;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'en_compra' | 'entregada';
  aprobadoPor?: string;
  fechaAprobacion?: Date;
  observaciones?: string;
  totalEstimado: number;
}

export interface ItemSolicitud {
  id: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  valorUnitarioEstimado?: number;
  proveedorSugerido?: string;
}

export interface TareaServicios {
  id: string;
  conjuntoId: string;
  asignadaA: string;
  tipo: 'limpieza' | 'jardineria' | 'mantenimiento' | 'inspeccion';
  descripcion: string;
  area?: string;
  frecuencia: 'diaria' | 'semanal' | 'quincenal' | 'mensual' | 'unica';
  fechaProgramada: Date;
  fechaEjecucion?: Date;
  estado: 'programada' | 'en_ejecucion' | 'completada' | 'cancelada';
  evidencias?: string[];
  observaciones?: string;
}

// ==================== MÓDULO DOCUMENTOS ====================

export interface DocumentoConjunto {
  id: string;
  conjuntoId: string;
  nombre: string;
  descripcion?: string;
  tipo: 'reglamento' | 'manual_convivencia' | 'acta_asamblea' | 'certificado' | 'contrato' | 'informe' | 'otro';
  categoria: 'legal' | 'administrativo' | 'financiero' | 'tecnico' | 'general';
  archivoUrl: string;
  archivoNombre: string;
  archivoTipo: string;
  archivoTamano: number;
  fechaSubida: Date;
  subidoPor: string;
  version?: string;
  vigenciaInicio?: Date;
  vigenciaFin?: Date;
  esPublico: boolean;
  requiereAprobacion: boolean;
  aprobadoPor?: string;
  fechaAprobacion?: Date;
  estado: 'activo' | 'obsoleto' | 'en_revision';
  etiquetas?: string[];
  descargas: number;
}

export interface CarpetaDocumento {
  id: string;
  conjuntoId: string;
  nombre: string;
  descripcion?: string;
  color: string;
  documentosCount: number;
}

// ==================== MÓDULO COMITÉ DE CONVIVENCIA ====================

export interface Conflicto {
  id: string;
  conjuntoId: string;
  numeroCaso: string;
  tipo: 'ruido' | 'mascotas' | 'parqueadero' | 'areas_comunes' | 'modificaciones' | 'basura' | 'otro';
  subtipo?: string;
  descripcion: string;
  unidadInvolucrada1: string;
  residenteInvolucrado1: string;
  unidadInvolucrada2?: string;
  residenteInvolucrado2?: string;
  testigos?: string[];
  fechaReporte: Date;
  fechaIncidente: Date;
  lugar?: string;
  estado: 'recibido' | 'en_revision' | 'en_mediacio' | 'sancionado' | 'archivado' | 'apelado';
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  evidencias?: string[];
  comiteAsignado: string[];
  historial: HistorialCaso[];
  resolucion?: Resolucion;
  sancion?: Sancion;
  fechaCierre?: Date;
}

export interface HistorialCaso {
  id: string;
  fecha: Date;
  accion: string;
  descripcion: string;
  realizadoPor: string;
  tipo: 'creacion' | 'asignacion' | 'seguimiento' | 'audiencia' | 'resolucion' | 'sancion' | 'apelacion' | 'cierre';
}

export interface Resolucion {
  fecha: Date;
  decision: 'procede' | 'no_procede' | 'conciliacion' | 'requiere_mas_informacion';
  fundamentos: string;
  recomendaciones?: string;
  emitidaPor: string;
  notificada: boolean;
  fechaNotificacion?: Date;
  aceptadaPorInvolucrados?: boolean;
}

export interface Sancion {
  tipo: 'llamado_atencion_verbal' | 'llamado_atencion_escrito' | 'multa' | 'suspension_servicios' | 'prohibicion_uso_areas';
  descripcion: string;
  valorMulta?: number;
  fechaInicio?: Date;
  fechaFin?: Date;
  condiciones?: string;
  emitidaPor: string;
  fechaEmision: Date;
  fechaNotificacion?: Date;
  cumplida: boolean;
  evidenciaCumplimiento?: string;
  apelada: boolean;
  fundamentosApelacion?: string;
}

export interface Audiencia {
  id: string;
  conflictoId: string;
  fecha: Date;
  hora: string;
  lugar: string;
  tipo: 'conciliacion' | 'arbitraje' | 'notificacion';
  asistentes: string[];
  unidadesInvolucradas: string[];
  acta?: string;
  acuerdos?: string;
  resultado: 'conciliacion' | 'no_conciliacion' | 'apertura_proceso' | 'diferimiento';
  evidencias?: string[];
  comitePresente: string[];
}

export interface EstadisticaConvivencia {
  totalCasos: number;
  casosPendientes: number;
  casosResueltos: number;
  casosArchivados: number;
  tasaResolucion: number;
  tiempoPromedioResolucion: number;
  casosPorTipo: { [tipo: string]: number };
  casosPorMes: { [mes: string]: number };
  sancionesAplicadas: number;
  multasCobradas: number;
  conciliacionesExitosas: number;
}

export interface ReglamentoInterno {
  id: string;
  conjuntoId: string;
  version: string;
  fechaAprobacion: Date;
  fechaVigencia: Date;
  contenido: string;
  articulos: ArticuloReglamento[];
  aprobadoPorAsamblea: boolean;
  actaAsamblea?: string;
  activo: boolean;
}

export interface ArticuloReglamento {
  numero: string;
  titulo: string;
  contenido: string;
  sanciones: string[];
  categoria: 'convivencia' | 'seguridad' | 'areas_comunes' | 'mascotas' | 'ruido' | 'otro';
}

export interface ConjuntoResidencial {
  id: string;
  nombre: string;
  direccion: string;
  localidad: string;
  estrato: number;
  tipo: 'casas' | 'torres' | 'mixto';
  totalUnidades: number;
  administradorId: string;
  fechaRegistro: Date;
  activo: boolean;
  logo?: string;
  telefono: string;
  email: string;
  // Campos de configuración física del conjunto (FASE 1)
  nombreConjunto?: string;
  cantidadCasas?: number;
  cantidadBloques?: number;
  cantidadTorres?: number;
  cantidadApartamentos?: number;
  cantidadConsejeros?: number;
  fechaCreacion?: Date;
  // Configuración administrativa (FASE 1B)
  cuotaAdministracion?: CuotaAdministracionConfig;
  cuotaAdministracionHistorial?: TarifaCuotaHistorial[];
  configuracionSeguridad?: ConfiguracionSeguridad;
  accesosRapidosAdmin?: string[];
}

export interface ConfiguracionSeguridad {
  valorParqueaderoVehiculo: number;
  valorParqueaderoMoto: number;
  actualizadoPor?: string;
  fechaActualizacion?: Date;
}

export interface TarifaCuotaHistorial {
  valorHastaDia16: number;
  valorDesdeDia17: number;
  diaCorteMora: number;
  vigenciaDesde: Date;
  vigenciaHasta: Date;
  actualizadoPor: string;
  fechaActualizacion: Date;
  motivo?: string;
}

export interface CuotaAdministracionConfig {
  // Campo legado (compatibilidad)
  valorMensual?: number;
  // Regla vigente de negocio: dos valores de cuota según fecha de pago.
  valorHastaDia16: number;
  valorDesdeDia17: number;
  diaVencimiento: number; // 1-31
  diaCorteMora: number; // normalmente fijo: 16
  aplicaInteresMora: boolean;
  tasaInteresMoraMensual?: number; // % mensual, ej: 2.0
  fechaVigenciaDesde?: Date;
  fechaVigenciaHasta?: Date;
}

export interface ConsejoMiembro {
  id: string;
  conjuntoId: string;
  nombres: string;
  apellidos: string;
  cargo: string;
  email?: string;
  telefono?: string;
  usuarioId?: string; // si se vincula a usuarios/{uid} en el futuro
  activo: boolean;
  fechaInicio?: Date;
  fechaFin?: Date;
  fechaRegistro: Date;
}

export interface Unidad {
  id: string;
  conjuntoId: string;
  numero: string;
  torre?: string;
  tipo: 'apartamento' | 'casa';
  coeficiente: number;
  residenteId?: string;
  estado: 'ocupada' | 'desocupada' | 'en_mantenimiento';
}

export interface Pago {
  id: string;
  conjuntoId: string;
  unidadId: string;
  residenteId: string;
  concepto: string;
  valor: number;
  fechaVencimiento: Date;
  fechaPago?: Date;
  estado: 'pendiente' | 'pagado' | 'vencido' | 'en_mora';
  metodoPago?: 'transferencia' | 'efectivo' | 'online';
  comprobante?: string;
  mes: number;
  anio: number;
  consecutivoGeneral?: string;
  consecutivoResidente?: string;
  aplicaInteresMora?: boolean;
  tasaInteresMoraMensual?: number;
  valorHastaDia16?: number;
  valorDesdeDia17?: number;
  valorEsperadoPago?: number;
  // Datos de multa/recargo por pago posterior al día 16
  multaDiaCorte?: number; // fijo: 16
  multaAplicada?: boolean;
  multaValor?: number; // valor adicional agregado al total pagado
  valorOriginalCuota?: number; // valor original de la cuota antes del recargo
  multaFecha?: Date; // fecha en la que se aplicó la multa (fechaPago)
  // Usuario que registró el pago
  registradoPor?: string;
  fechaCreacion?: Date;
}


export interface ActualizacionConceptoPago {
  fecha: Date;
  actualizadoPor: string;
  cambios: string;
}

export interface ConceptoPagoConfig {
  id: string;
  conjuntoId: string;
  nombre: string;
  descripcion?: string;
  valorBase?: number;
  aplicaInteresMora: boolean;
  activo: boolean;
  creadoPor: string;
  fechaCreacion: Date;
  // Rango de vigencia del concepto (opcional)
  fechaVigenciaDesde?: Date;
  fechaVigenciaHasta?: Date;
  historialActualizaciones: ActualizacionConceptoPago[];
}

export interface CajaMenor {
  id: string;
  conjuntoId: string;
  montoAprobado: number;
  fechaAprobacion: Date;
  aprobadoPor: string;
  estado: 'abierta' | 'cerrada';
  observaciones?: string;
}

export interface GastoCajaMenor {
  id: string;
  cajaMenorId: string;
  conjuntoId: string;
  concepto: string;
  valor: number;
  fechaGasto: Date;
  soporteUrl?: string;
  soporteNombre?: string;
  registradoPor: string;
}
export interface Comunicado {
  id: string;
  conjuntoId: string;
  autorId: string;
  titulo: string;
  contenido: string;
  fecha: Date;
  tipo: 'general' | 'urgente' | 'asamblea' | 'mantenimiento';
  destinatarios: 'todos' | 'torre' | 'unidad' | 'seguridad' | 'comite_convivencia' | 'consejo_administracion';
  torreDestino?: string;
  unidadDestino?: string;
  leidoPor: string[];
  adjuntos?: string[];
}

export interface Sugerencia {
  id: string;
  conjuntoId: string;
  usuarioId: string;
  contenido: string;
  fecha: Date;
  usuarioNombre?: string;
  usuarioUnidad?: string;
  usuarioTorre?: string;
}

export interface Asamblea {
  id: string;
  conjuntoId: string;
  creadoPor: string;
  titulo: string;
  descripcion: string;
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  lugar: string;
  tipo: 'ordinaria' | 'extraordinaria';
  estado: 'programada' | 'en_curso' | 'finalizada' | 'cancelada';
  quorumRequerido: number;
  quorumAlcanzado: number;
  habilitarVotacion: boolean;
  tiempoVotacionMinutos: number;
  votaciones: Votacion[];
}

export interface VotoRegistrado {
  usuarioId: string;
  unidadId?: string;
  opcion: 'SI' | 'NO';
  fecha: Date;
}

export interface Votacion {
  id: string;
  conjuntoId: string;
  asambleaId: string;
  pregunta: string;
  opciones: ('SI' | 'NO')[];
  votos: { [opcion: string]: number };
  votantes: string[];
  votosRegistrados: VotoRegistrado[];
  estado: 'activa' | 'cerrada';
  fechaCierre?: Date;
}

export interface AsambleaBitacora {
  id: string;
  conjuntoId: string;
  asambleaId: string;
  usuarioId: string;
  evento: 'creacion_asamblea' | 'apertura_votacion' | 'cierre_votacion' | 'voto_registrado';
  detalle: string;
  fecha: Date;
}

export interface Visitante {
  id: string;
  conjuntoId: string;
  nombre: string;
  documento: string;
  telefono?: string;
  unidadDestino: string;
  residenteAutoriza: string;
  fechaIngreso: Date;
  fechaSalida?: Date;
  tipo: 'visitante' | 'domicilio' | 'servicio' | 'proveedor';
  placaVehiculo?: string;
  vehiculoTipo?: 'ninguno' | 'carro' | 'moto';
  valorParqueaderoConfigurado?: number;
  cobroParqueadero?: number;
  cobroEstado?: 'pendiente' | 'cobrado' | 'no_aplica';
  cobroFecha?: Date;
  cobroRegistradoPor?: string;
  observaciones?: string;
  registradoPor: string;
}

export interface Incidente {
  id: string;
  conjuntoId: string;
  unidadId?: string;
  residenteId?: string;
  tipo: 'ruido' | 'mascotas' | 'parqueadero' | 'seguridad' | 'mantenimiento' | 'otro';
  categoria?: 'danos_materiales' | 'accidente_personal' | 'ruido_convivencia' | 'seguridad_robo' | 'otro';
  reportadoPorNombre?: string;
  reportadoPorTelefono?: string;
  reportadoPorEmail?: string;
  fechaIncidente?: Date;
  horaIncidente?: string;
  ubicacion?: string;
  descripcion: string;
  accionesInmediatas?: string;
  testigos?: string;
  fecha: Date;
  estado: 'reportado' | 'en_proceso' | 'resuelto' | 'cerrado';
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  asignadoA?: string;
  fechaResolucion?: Date;
  respuesta?: string;
  evidencias?: string[];
}

export interface ReservaZona {
  id: string;
  conjuntoId: string;
  zonaId: string;
  residenteId: string;
  unidadId: string;
  fechaSolicitud?: Date;
  fechaRespuesta?: Date;
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
  valor?: number;
  observaciones?: string;
}

export interface ZonaComun {
  id: string;
  conjuntoId: string;
  nombre: string;
  tipo: 'salon' | 'piscina' | 'gimnasio' | 'bbq' | 'parque' | 'cancha' | 'otro';
  capacidad: number;
  descripcion: string;
  horarioApertura: string;
  horarioCierre: string;
  requiereReserva: boolean;
  valorReserva?: number;
  activo: boolean;
  imagenes?: string[];
}

export interface Notificacion {
  id: string;
  usuarioId: string;
  titulo: string;
  mensaje: string;
  tipo: 'pago' | 'comunicado' | 'asamblea' | 'seguridad' | 'incidente' | 'reserva';
  fecha: Date;
  leida: boolean;
  referenciaId?: string;
}

export interface DashboardStats {
  totalUnidades: number;
  unidadesOcupadas: number;
  unidadesDesocupadas: number;
  morosos: number;
  recaudoMes: number;
  recaudoPendiente: number;
  incidentesAbiertos: number;
  visitantesHoy: number;
}



// ==================== FLUJO FORMAL COMITÉ -> CONSEJO -> ADMIN ====================

export interface SolicitudGestion {
  id: string;
  conjuntoId: string;
  tipo: 'caja_menor' | 'multa_convivencia';
  estado: 'pendiente_consejo' | 'aprobada_consejo' | 'rechazada_consejo' | 'ejecutada_admin';
  titulo: string;
  descripcion: string;
  monto?: number;
  unidadObjetivo?: string; // No. casa para cobro de multa
  conflictoId?: string;
  solicitadaPor: string;
  solicitadaPorRol: 'comite_convivencia';
  fechaSolicitud: Date;
  decisionConsejoPor?: string;
  fechaDecisionConsejo?: Date;
  motivoDecisionConsejo?: string;
  ejecutadaPor?: string;
  fechaEjecucion?: Date;
  detalleEjecucion?: string;
  cajaMenorId?: string;
  pagoId?: string;
  requiereActa?: boolean;
  requiereSoporte?: boolean;
  anexoActaUrl?: string;
  anexoActaNombre?: string;
  anexoSoporteUrl?: string;
  anexoSoporteNombre?: string;
  consejoQuorumRequerido?: number;
  consejoAprobaciones?: string[];
  consejoRechazos?: string[];
  actaFolio?: string;
  actaFirmasConsejo?: string[];
  consejoVotosBloqueo?: string[];
}

export interface SolicitudGestionBitacora {
  id: string;
  solicitudId: string;
  fecha: Date;
  actorId: string;
  actorRol: 'comite_convivencia' | 'consejo' | 'administrador';
  accion: 'creada' | 'anexos_actualizados' | 'voto_consejo' | 'aprobada_consejo' | 'rechazada_consejo' | 'ejecutada_admin';
  detalle: string;
}
