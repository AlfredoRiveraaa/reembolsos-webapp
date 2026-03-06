import { useState } from "react";
import { Link } from "react-router";
import { Calendar, FileText, AlertCircle, DollarSign, Filter, Download, Eye } from "lucide-react";

// Mock data simulando la API de SQL Server
const mockReimbursements = [
  {
    id: "1",
    fecha: "2026-03-01",
    remitente: "Juan Pérez García",
    asunto: "Gastos de conferencia académica",
    uuid: "A1B2C3D4-E5F6-7890-ABCD-EF1234567890",
    total: 8500.00,
    estado: "Aprobado",
  },
  {
    id: "2",
    fecha: "2026-03-02",
    remitente: "María López Hernández",
    asunto: "Material didáctico",
    uuid: "B2C3D4E5-F6G7-8901-BCDE-F12345678901",
    total: 3200.50,
    estado: "Pendiente",
  },
  {
    id: "3",
    fecha: "2026-03-02",
    remitente: "Carlos Ramírez Torres",
    asunto: "Viáticos de investigación",
    uuid: "C3D4E5F6-G7H8-9012-CDEF-123456789012",
    total: 12750.00,
    estado: "Aprobado",
  },
  {
    id: "4",
    fecha: "2026-03-03",
    remitente: "Ana Martínez Silva",
    asunto: "Equipo de laboratorio",
    uuid: "D4E5F6G7-H8I9-0123-DEFG-234567890123",
    total: 25600.00,
    estado: "En revisión",
  },
  {
    id: "5",
    fecha: "2026-03-04",
    remitente: "Luis Sánchez Ortiz",
    asunto: "Gastos de transporte",
    uuid: "E5F6G7H8-I9J0-1234-EFGH-345678901234",
    total: 1850.75,
    estado: "Rechazado",
  },
  {
    id: "6",
    fecha: "2026-03-04",
    remitente: "Patricia Gómez Ruiz",
    asunto: "Publicación académica",
    uuid: "F6G7H8I9-J0K1-2345-FGHI-456789012345",
    total: 4500.00,
    estado: "Aprobado",
  },
];

export function Dashboard() {
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroUUID, setFiltroUUID] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const solicitudesDelMes = mockReimbursements.filter(r => r.fecha.includes("2026-03")).length;
  const duplicadas = 2; // Ejemplo
  const totalAcumulado = mockReimbursements.reduce((sum, r) => sum + r.total, 0);

  const reembolsosFiltrados = mockReimbursements.filter((r) => {
    if (filtroFecha && !r.fecha.includes(filtroFecha)) return false;
    if (filtroUUID && !r.uuid.toLowerCase().includes(filtroUUID.toLowerCase())) return false;
    if (filtroEstado && r.estado !== filtroEstado) return false;
    return true;
  });

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
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Dashboard de Reembolsos</h1>
        <p className="text-gray-600">Resumen y gestión de solicitudes de reembolso</p>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2"> ________________________   </h1>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Acciones de hoy </h1>
      </div>

      {/* Cards de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-[#1e3a5f]" />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Total solicitudes de hoy</p>
          <p className="text-3xl font-semibold text-gray-900">{mockReimbursements.length}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Solicitudes del pendientes</p>
          <p className="text-3xl font-semibold text-gray-900">{solicitudesDelMes}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Solicitudes rechazadas</p>
          <p className="text-3xl font-semibold text-gray-900">{duplicadas}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Total monto acumulado</p>
          <p className="text-3xl font-semibold text-gray-900">
            ${totalAcumulado.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Solicitudes de reembolso</h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#152d47] transition-colors">
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filtro por fecha
              </label>
              <input
                type="date"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filtro por UUID
              </label>
              <input
                type="text"
                placeholder="Buscar UUID..."
                value={filtroUUID}
                onChange={(e) => setFiltroUUID(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filtro por estado
              </label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
              >
                <option value="">Todos los estados</option>
                <option value="Aprobado">Aprobado</option>
                <option value="Pendiente">Pendiente</option>
                <option value="En revisión">En revisión</option>
                <option value="Rechazado">Rechazado</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remitente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asunto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  UUID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reembolsosFiltrados.map((reembolso) => (
                <tr key={reembolso.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(reembolso.fecha).toLocaleDateString("es-MX")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reembolso.remitente}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {reembolso.asunto}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                    {reembolso.uuid.substring(0, 18)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${reembolso.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${getEstadoColor(
                        reembolso.estado
                      )}`}
                    >
                      {reembolso.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      to={`/reembolso/${reembolso.id}`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#152d47] transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {reembolsosFiltrados.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Filter className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No se encontraron solicitudes con los filtros aplicados</p>
          </div>
        )}
      </div>
    </div>
  );
}
