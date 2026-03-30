from datetime import datetime

from pydantic import BaseModel, Field


class PagoItem(BaseModel):
    id: str
    conjunto_id: str = Field(alias="conjuntoId")
    unidad_id: str = Field(alias="unidadId")
    residente_id: str = Field(alias="residenteId")
    concepto: str
    valor: float
    fecha_vencimiento: datetime = Field(alias="fechaVencimiento")
    fecha_pago: datetime | None = Field(default=None, alias="fechaPago")
    estado: str
    metodo_pago: str | None = Field(default=None, alias="metodoPago")
    comprobante: str | None = None
    mes: int
    anio: int
    consecutivo_general: str | None = Field(default=None, alias="consecutivoGeneral")
    consecutivo_residente: str | None = Field(default=None, alias="consecutivoResidente")
    aplica_interes_mora: bool | None = Field(default=None, alias="aplicaInteresMora")
    tasa_interes_mora_mensual: float | None = Field(default=None, alias="tasaInteresMoraMensual")
    valor_hasta_dia_16: float | None = Field(default=None, alias="valorHastaDia16")
    valor_desde_dia_17: float | None = Field(default=None, alias="valorDesdeDia17")
    valor_esperado_pago: float | None = Field(default=None, alias="valorEsperadoPago")
    multa_dia_corte: int | None = Field(default=None, alias="multaDiaCorte")
    multa_aplicada: bool | None = Field(default=None, alias="multaAplicada")
    multa_valor: float | None = Field(default=None, alias="multaValor")
    valor_original_cuota: float | None = Field(default=None, alias="valorOriginalCuota")
    fecha_creacion: datetime | None = Field(default=None, alias="fechaCreacion")


class PagosListResponse(BaseModel):
    total: int
    items: list[PagoItem]


class GenerarPagosRequest(BaseModel):
    mes: int
    anio: int
    permitir_futuro: bool = Field(default=False, alias="permitirFuturo")


class GenerarPagosResponse(BaseModel):
    creados: int
    omitidos_duplicado: int
    total_unidades: int
    total_conceptos: int


class WebhookPagoRequest(BaseModel):
    referencia_pago_id: str = Field(alias="referenciaPagoId", description="ID del pago en Firestore")
    estado_transaccion: str = Field(alias="estadoTransaccion", description="Aprobado, Rechazado, Pendiente")
    referencia_pasarela: str = Field(alias="referenciaPasarela", description="Referencia única de la pasarela")
    metodo_pago: str = Field(alias="metodoPago", description="PSE, Nequi, Tarjeta")
    fecha_transaccion: datetime = Field(alias="fechaTransaccion")


class WebhookPagoResponse(BaseModel):
    success: bool
    mensaje: str


class PagoManualRequest(BaseModel):
    metodo_pago: str = Field(alias="metodoPago", description="Transferencia, Efectivo, Consignación")
    comprobante_url: str = Field(alias="comprobanteUrl", description="URL del archivo adjunto")
    fecha_pago: datetime = Field(alias="fechaPago")
