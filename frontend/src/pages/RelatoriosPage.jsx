import {
  FiDownload,
  FiFileText,
  FiHardDrive,
  FiMonitor,
  FiTool,
} from "react-icons/fi";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const relatorios = [
  {
    titulo: "Equipamentos / Almoxarifado",
    descricao: "Exporta patrimônio, tipo, marca, modelo, série, setor, responsável, status, compra, fornecedor, nota fiscal, garantia e observações.",
    icone: FiHardDrive,
    excel: "/relatorios/equipamentos/excel/",
    pdf: "/relatorios/equipamentos/pdf/",
  },
  {
    titulo: "Computadores",
    descricao: "Exporta usuários, setor, IP, MAC, especificações, processador, memória, armazenamento, fonte e observações.",
    icone: FiMonitor,
    excel: "/relatorios/computadores/excel/",
    pdf: "/relatorios/computadores/pdf/",
  },
  {
    titulo: "Histórico / Manutenções",
    descricao: "Exporta registros de manutenção, limpeza, movimentação, baixa, responsável, custo, status e descrição.",
    icone: FiTool,
    excel: "/relatorios/manutencoes/excel/",
    pdf: "/relatorios/manutencoes/pdf/",
  },
];

function montarUrl(endpoint, busca) {
  const termo = busca.trim();

  if (!termo) {
    return `${API_BASE_URL}${endpoint}`;
  }

  return `${API_BASE_URL}${endpoint}?q=${encodeURIComponent(termo)}`;
}

function CardRelatorio({ relatorio, busca }) {
  const Icone = relatorio.icone;

  return (
    <div className="border border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-slate-950 text-white">
            <Icone size={22} />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-950">
              {relatorio.titulo}
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              {relatorio.descricao}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2">
        <a
          href={montarUrl(relatorio.excel, busca)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 border border-emerald-700 bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800"
        >
          <FiDownload size={17} />
          Baixar Excel
        </a>

        <a
          href={montarUrl(relatorio.pdf, busca)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 border border-red-700 bg-red-700 px-4 py-3 text-sm font-bold text-white hover:bg-red-800"
        >
          <FiFileText size={17} />
          Baixar PDF
        </a>
      </div>
    </div>
  );
}

export default function RelatoriosPage() {
  const busca = "";

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Exportação de relatórios
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Gere arquivos em Excel ou PDF com os dados cadastrados no sistema.
            </p>
          </div>

          <div className="border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Os relatórios usam os dados atuais do sistema.
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {relatorios.map((relatorio) => (
          <CardRelatorio
            key={relatorio.titulo}
            relatorio={relatorio}
            busca={busca}
          />
        ))}
      </div>

      <div className="mt-6 border border-slate-200 bg-white p-5">
        <h3 className="text-base font-bold text-slate-950">
          Observação
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          O Excel sai mais completo, ideal para filtros, conferência e auditoria.
          O PDF sai mais resumido e apresentável, ideal para visualização rápida ou envio.
        </p>
      </div>
    </div>
  );
}