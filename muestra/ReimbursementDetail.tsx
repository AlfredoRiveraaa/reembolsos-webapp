import { useParams, Link } from "react-router";
import { ArrowLeft, Download, FileText, Calendar, Building2, Hash, DollarSign, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useState } from "react";

// Mock data detallado
const mockReimbursementDetails = {
  "1": {
    id: "1",
    fecha: "2026-03-01",
    remitente: "Juan Pérez García",
    asunto: "Gastos de conferencia académica",
    uuid: "A1B2C3D4-E5F6-7890-ABCD-EF1234567890",
    total: 8500.00,
    estado: "Aprobado",
    rfcEmisor: "ABC123456DEF",
    rfcReceptor: "UNI987654321",
    fechaTimbrado: "2026-03-01T10:30:00",
    descripcion: "Reembolso de gastos por participación en la Conferencia Internacional de Educación Superior celebrada en Guadalajara, incluyendo transporte, hospedaje y registro.",
    conceptos: [
      { descripcion: "Transporte aéreo redondo", cantidad: 1, precioUnitario: 3500.00 },
      { descripcion: "Hospedaje (3 noches)", cantidad: 3, precioUnitario: 1200.00 },
      { descripcion: "Registro conferencia", cantidad: 1, precioUnitario: 2100.00 },
    ],
  },
  "2": {
    id: "2",
    fecha: "2026-03-02",
    remitente: "María López Hernández",
    asunto: "Material didáctico",
    uuid: "B2C3D4E5-F6G7-8901-BCDE-F12345678901",
    total: 3200.50,
    estado: "Pendiente",
    rfcEmisor: "XYZ789012GHI",
    rfcReceptor: "UNI987654321",
    fechaTimbrado: "2026-03-02T14:20:00",
    descripcion: "Compra de material didáctico para el curso de Matemáticas Aplicadas del semestre actual.",
    conceptos: [
      { descripcion: "Libros de texto", cantidad: 15, precioUnitario: 180.00 },
      { descripcion: "Material de papelería", cantidad: 1, precioUnitario: 500.50 },
    ],
  },
};

export function ReimbursementDetail() {
  const { id } = useParams<{ id: string }>();
  const detalle = mockReimbursementDetails[id as keyof typeof mockReimbursementDetails];
  const [estadoActual, setEstadoActual] = useState(detalle?.estado || "");

  if (!detalle) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Reembolso no encontrado</p>
          <Link to="/" className="text-[#1e3a5f] hover:underline mt-4 inline-block">
            Volver al dashboard
          </Link>
        </div>
      </div>
    );
  }

  const handleCambiarEstado = (nuevoEstado: string) => {
    setEstadoActual(nuevoEstado);
    // Aquí se haría la llamada a la API para actualizar el estado en el servidor
    console.log(`Estado cambiado de "${detalle.estado}" a "${nuevoEstado}"`);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Aprobado":
        return "bg-green-100 text-green-800";
      case "Pendiente":
        return "bg-yellow-100 text-yellow-800";
      case "En revisión":
        return "bg-blue-100 text-blue-800";
      case "Rechazado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[#1e3a5f] hover:text-[#152d47] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al dashboard
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">{detalle.asunto}</h1>
            <p className="text-gray-600">Detalle de la solicitud de reembolso</p>
          </div>
          <span
            className={`px-4 py-2 inline-flex text-sm font-medium rounded-lg ${getEstadoColor(
              estadoActual
            )}`}
          >
            {estadoActual}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información general */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información General</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-[#1e3a5f]" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de solicitud</p>
                  <p className="font-medium text-gray-900">
                    {new Date(detalle.fecha).toLocaleDateString("es-MX", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Solicitante</p>
                  <p className="font-medium text-gray-900">{detalle.remitente}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Hash className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">UUID</p>
                  <p className="font-medium text-gray-900 text-xs font-mono">{detalle.uuid}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monto total</p>
                  <p className="text-xl font-semibold text-gray-900">
                    ${detalle.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Descripción</p>
              <p className="text-gray-900 leading-relaxed">{detalle.descripcion}</p>
            </div>
          </div>

          {/* Conceptos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Conceptos</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-sm font-medium text-gray-600">Descripción</th>
                    <th className="text-center py-3 text-sm font-medium text-gray-600">Cantidad</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-600">Precio Unitario</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-600">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {detalle.conceptos.map((concepto, index) => (
                    <tr key={index} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 text-sm text-gray-900">{concepto.descripcion}</td>
                      <td className="py-3 text-sm text-gray-900 text-center">{concepto.cantidad}</td>
                      <td className="py-3 text-sm text-gray-900 text-right">
                        ${concepto.precioUnitario.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-sm font-medium text-gray-900 text-right">
                        ${(concepto.cantidad * concepto.precioUnitario).toLocaleString("es-MX", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200">
                    <td colSpan={3} className="py-3 text-sm font-semibold text-gray-900 text-right">
                      Total:
                    </td>
                    <td className="py-3 text-lg font-semibold text-gray-900 text-right">
                      ${detalle.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar derecha */}
        <div className="space-y-6">
          {/* Documentos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Documentos</h2>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-5 h-5 text-[#1e3a5f]" />
                <div className="text-left flex-1">
                  <p className="font-medium text-gray-900 text-sm">Descargar XML</p>
                  <p className="text-xs text-gray-500">Factura electrónica</p>
                </div>
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-5 h-5 text-[#1e3a5f]" />
                <div className="text-left flex-1">
                  <p className="font-medium text-gray-900 text-sm">Descargar PDF 1</p>
                  <p className="text-xs text-gray-500">Representación impresa</p>
                </div>
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-5 h-5 text-[#1e3a5f]" />
                <div className="text-left flex-1">
                  <p className="font-medium text-gray-900 text-sm">Descargar PDF 2</p>
                  <p className="text-xs text-gray-500">Comprobante adicional</p>
                </div>
              </button>
            </div>
          </div>

          {/* Información fiscal */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Fiscal</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">RFC Emisor</p>
                <p className="font-medium text-gray-900 font-mono text-sm">{detalle.rfcEmisor}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">RFC Receptor</p>
                <p className="font-medium text-gray-900 font-mono text-sm">{detalle.rfcReceptor}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Fecha de Timbrado</p>
                <p className="font-medium text-gray-900">
                  {new Date(detalle.fechaTimbrado).toLocaleString("es-MX", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Monto Total</p>
                <p className="text-xl font-semibold text-gray-900">
                  ${detalle.total.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cambiar Estado</h2>
            <div className="space-y-3">
              
              <button
                onClick={() => handleCambiarEstado("Aprobado")}
                disabled={estadoActual === "Aprobado"}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                  estadoActual === "Aprobado"
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                Aprobar
              </button>
              
              <button
                onClick={() => handleCambiarEstado("En revisión")}
                disabled={estadoActual === "En revisión"}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                  estadoActual === "En revisión"
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <Clock className="w-5 h-5" />
                En revisión
              </button>
              
              <button
                onClick={() => handleCambiarEstado("Rechazado")}
                disabled={estadoActual === "Rechazado"}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                  estadoActual === "Rechazado"
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                <XCircle className="w-5 h-5" />
                Rechazar
              </button>



              <button
                onClick={() => handleCambiarEstado("Pendiente")}
                disabled={estadoActual === "Pendiente"}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                  estadoActual === "Pendiente"
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-yellow-600 text-white hover:bg-green-700"
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                Pendiente
              </button>
              

              
            </div>
            
            {estadoActual !== detalle.estado && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Estado actualizado:</strong> El reembolso ahora está marcado como "{estadoActual}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
