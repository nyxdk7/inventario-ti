import { useEffect, useState } from "react";
import {
  FiBox,
  FiEdit2,
  FiEye,
  FiGrid,
  FiMapPin,
  FiPlus,
  FiSearch,
  FiServer,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import { apiRequest } from "../services/api";

const formularioInicial = {
  nome: "",
  codigo: "",
  setor_id: "",
  localizacao: "",
  responsavel: "",
  altura_u: "42",
  largura_polegadas: "19",
  status: "ativo",
  observacoes: "",
};

const inputClasse =
  "w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5";

function badgeStatus(status) {
  const classes = {
    ativo: "border-emerald-200 bg-emerald-50 text-emerald-700",
    planejamento: "border-sky-200 bg-sky-50 text-sky-700",
    manutencao: "border-amber-200 bg-amber-50 text-amber-700",
    inativo: "border-slate-200 bg-slate-100 text-slate-600",
  };
  return classes[status] || classes.inativo;
}

function corStatus(status) {
  const classes = {
    ativo: "text-emerald-600",
    planejamento: "text-sky-600",
    manutencao: "text-amber-600",
    inativo: "text-slate-400",
  };
  return classes[status] || classes.inativo;
}

function Aviso({ aviso, aoFechar }) {
  if (!aviso) return null;
  const erro = aviso.tipo === "erro";
  return (
    <div
      className={`mb-4 flex items-start justify-between gap-4 border p-4 text-sm ${
        erro
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      <span>{aviso.texto}</span>
      <button type="button" onClick={aoFechar}>
        <FiX size={17} />
      </button>
    </div>
  );
}

function ResumoCard({ titulo, valor, descricao, icone: Icone }) {
  return (
    <div className="border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {titulo}
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">{valor ?? 0}</p>
          <p className="mt-1 text-sm text-slate-500">{descricao}</p>
        </div>
        <Icone size={22} className="mt-1 shrink-0 text-slate-400" />
      </div>
    </div>
  );
}

function MiniRack({ site }) {
  const percentual = Math.min(Number(site.ocupacao?.percentual_frente || 0), 100);
  const blocos = Math.min(Math.max(site.total_ativos || 0, 1), 8);

  return (
    <div className="w-24 shrink-0">
      <div className="relative mx-auto h-32 w-20 border-4 border-slate-700 bg-slate-950 p-1 shadow-inner">
        <div className="absolute -left-1 top-2 h-2 w-1 bg-slate-500" />
        <div className="absolute -right-1 top-2 h-2 w-1 bg-slate-500" />
        <div className="absolute -left-1 bottom-2 h-2 w-1 bg-slate-500" />
        <div className="absolute -right-1 bottom-2 h-2 w-1 bg-slate-500" />
        <div className="flex h-full flex-col-reverse gap-1 overflow-hidden">
          {Array.from({ length: blocos }).map((_, indice) => (
            <div
              key={indice}
              className={`min-h-2 flex-1 border border-slate-500 ${
                indice % 3 === 0 ? "bg-slate-700" : indice % 3 === 1 ? "bg-slate-800" : "bg-slate-600"
              }`}
            >
              <div className="mx-auto mt-1 flex justify-center gap-0.5">
                {Array.from({ length: 6 }).map((__, porta) => (
                  <span
                    key={porta}
                    className={`h-1 w-1 ${porta < 3 ? "bg-emerald-400" : "bg-slate-500"}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden bg-slate-200">
        <div className="h-full bg-slate-700" style={{ width: `${percentual}%` }} />
      </div>
      <p className="mt-1 text-center text-[10px] font-bold text-slate-500">
        {site.ocupacao?.usados_frente || 0}U / {site.altura_u}U
      </p>
    </div>
  );
}

function SiteCard({ site, aoVer, aoEditar, aoExcluir, podeEditar, podeExcluir }) {
  return (
    <article className="border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm sm:p-5">
      <div className="flex flex-col gap-5 sm:flex-row">
        <MiniRack site={site} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <FiServer size={20} className={corStatus(site.status)} />
            <h3 className="truncate text-lg font-black text-slate-950">{site.nome}</h3>
            <span className={`border px-2 py-1 text-xs font-bold ${badgeStatus(site.status)}`}>
              {site.status_display}
            </span>
          </div>

          <p className="mt-1 text-sm font-semibold text-slate-600">
            {site.codigo || "Sem código"} · Rack {site.altura_u}U / {site.largura_polegadas}”
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Localização
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                {site.localizacao || "-"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Setor
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                {site.setor?.nome || "Sem setor"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Responsável
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                {site.responsavel || "-"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Ativos instalados
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {site.total_ativos || 0}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-bold text-slate-600">Frente do rack</span>
                <span className="text-slate-500">
                  {site.ocupacao?.percentual_frente || 0}% ocupado
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden bg-slate-200">
                <div
                  className="h-full bg-slate-700"
                  style={{ width: `${Math.min(site.ocupacao?.percentual_frente || 0, 100)}%` }}
                />
              </div>
            </div>
            <div className="border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-bold text-slate-600">Traseira do rack</span>
                <span className="text-slate-500">
                  {site.ocupacao?.percentual_traseira || 0}% ocupado
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden bg-slate-200">
                <div
                  className="h-full bg-slate-500"
                  style={{ width: `${Math.min(site.ocupacao?.percentual_traseira || 0, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:min-w-36">
          <button
            type="button"
            onClick={() => aoVer(site.id)}
            className="flex items-center justify-center gap-2 border border-slate-950 bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
          >
            <FiEye size={16} /> Abrir site
          </button>
          {podeEditar && (
            <button
              type="button"
              onClick={() => aoEditar(site)}
              className="flex items-center justify-center gap-2 border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
            >
              <FiEdit2 size={16} /> Editar
            </button>
          )}
          {podeExcluir && (
            <button
              type="button"
              onClick={() => aoExcluir(site)}
              className="flex items-center justify-center gap-2 border border-red-200 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50"
            >
              <FiTrash2 size={16} /> Excluir
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function Campo({ label, obrigatorio = false, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-slate-700">
        {label}
        {obrigatorio && <span className="text-red-600"> *</span>}
      </label>
      {children}
    </div>
  );
}

export default function SitesPage({ permissoes, aoVerDetalhes }) {
  const [sites, setSites] = useState([]);
  const [setores, setSetores] = useState([]);
  const [opcoes, setOpcoes] = useState({ status_sites: [] });
  const [resumo, setResumo] = useState({});
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [formulario, setFormulario] = useState(formularioInicial);
  const [editandoId, setEditandoId] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState(null);

  const podeEditar = permissoes?.podeEditarInventario ?? true;
  const podeExcluir = permissoes?.podeExcluir ?? true;

  async function carregarSites() {
    setCarregando(true);
    try {
      const parametros = new URLSearchParams();
      if (busca.trim()) parametros.set("q", busca.trim());
      if (filtroStatus) parametros.set("status", filtroStatus);
      const sufixo = parametros.toString() ? `?${parametros.toString()}` : "";
      const dados = await apiRequest(`/sites/${sufixo}`);
      setSites(dados.resultados || []);
      setResumo(dados.resumo || {});
      setOpcoes(dados.opcoes || { status_sites: [] });
    } catch (erro) {
      setAviso({ tipo: "erro", texto: erro.message });
    } finally {
      setCarregando(false);
    }
  }

  async function carregarSetores() {
    try {
      const dados = await apiRequest("/setores/");
      setSetores(dados.resultados || []);
    } catch (erro) {
      setAviso({ tipo: "erro", texto: erro.message });
    }
  }

  useEffect(() => {
    carregarSetores();
  }, []);

  useEffect(() => {
    const temporizador = window.setTimeout(carregarSites, 250);
    return () => window.clearTimeout(temporizador);
  }, [busca, filtroStatus]);

  function alterarCampo(evento) {
    const { name, value } = evento.target;
    setFormulario((atual) => ({ ...atual, [name]: value }));
  }

  function abrirNovo() {
    setFormulario(formularioInicial);
    setEditandoId(null);
    setAviso(null);
    setModalAberto(true);
  }

  function abrirEdicao(site) {
    setFormulario({
      ...formularioInicial,
      ...site,
      setor_id: site.setor_id || "",
      altura_u: String(site.altura_u || 42),
      largura_polegadas: String(site.largura_polegadas || 19),
    });
    setEditandoId(site.id);
    setAviso(null);
    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) return;
    setModalAberto(false);
    setEditandoId(null);
    setFormulario(formularioInicial);
  }

  async function salvar(evento) {
    evento.preventDefault();
    setSalvando(true);
    setAviso(null);
    try {
      const endpoint = editandoId ? `/sites/${editandoId}/` : "/sites/";
      const metodo = editandoId ? "PUT" : "POST";
      const dados = await apiRequest(endpoint, {
        method: metodo,
        body: JSON.stringify(formulario),
      });
      setAviso({ tipo: "sucesso", texto: dados.mensagem });
      setModalAberto(false);
      setEditandoId(null);
      setFormulario(formularioInicial);
      await carregarSites();
    } catch (erro) {
      const detalhes = erro.dados?.erro;
      const texto =
        typeof detalhes === "object"
          ? Object.values(detalhes).flat().join(" ")
          : erro.message;
      setAviso({ tipo: "erro", texto });
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(site) {
    if (
      !window.confirm(
        `Excluir o site / rack ${site.nome}? Todos os ativos e portas cadastrados dentro dele também serão removidos.`,
      )
    ) {
      return;
    }
    try {
      const dados = await apiRequest(`/sites/${site.id}/`, { method: "DELETE" });
      setAviso({ tipo: "sucesso", texto: dados.mensagem });
      await carregarSites();
    } catch (erro) {
      setAviso({ tipo: "erro", texto: erro.message });
    }
  }

  return (
    <div>
      <Aviso aviso={aviso} aoFechar={() => setAviso(null)} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-950">Sites e racks</h2>
          <p className="mt-1 text-sm text-slate-500">
            Visão física dos racks, ocupação em U e ativos instalados em cada local.
          </p>
        </div>
        {podeEditar && (
          <button
            type="button"
            onClick={abrirNovo}
            className="flex items-center justify-center gap-2 bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800"
          >
            <FiPlus size={17} /> Novo site / rack
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <ResumoCard titulo="Sites" valor={resumo.total} descricao="Racks cadastrados" icone={FiServer} />
        <ResumoCard titulo="Ativos" valor={resumo.ativos} descricao="Sites em operação" icone={FiGrid} />
        <ResumoCard titulo="Planejamento" valor={resumo.planejamento} descricao="Ainda em montagem" icone={FiBox} />
        <ResumoCard titulo="Equipamentos" valor={resumo.total_ativos} descricao="Ativos nos racks" icone={FiServer} />
        <ResumoCard titulo="Switches" valor={resumo.switches} descricao="Instalados em sites" icone={FiServer} />
        <ResumoCard titulo="Patch panels" valor={resumo.patch_panels} descricao="Painéis cadastrados" icone={FiGrid} />
      </div>

      <div className="mt-5 border border-slate-200 bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_240px]">
          <div className="relative">
            <FiSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={17}
            />
            <input
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar por site, código, localização, setor, responsável ou ativo"
              className={`${inputClasse} pl-10`}
            />
          </div>
          <select
            value={filtroStatus}
            onChange={(evento) => setFiltroStatus(evento.target.value)}
            className={inputClasse}
          >
            <option value="">Todos os status</option>
            {opcoes.status_sites?.map((opcao) => (
              <option key={opcao.value} value={opcao.value}>
                {opcao.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {carregando ? (
          <div className="border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Carregando sites...
          </div>
        ) : sites.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-white p-10 text-center">
            <FiServer size={32} className="mx-auto text-slate-300" />
            <p className="mt-3 font-bold text-slate-700">Nenhum site / rack encontrado</p>
            <p className="mt-1 text-sm text-slate-500">
              Cadastre o primeiro rack para iniciar o mapa físico da infraestrutura.
            </p>
          </div>
        ) : (
          sites.map((site) => (
            <SiteCard
              key={site.id}
              site={site}
              aoVer={aoVerDetalhes}
              aoEditar={abrirEdicao}
              aoExcluir={excluir}
              podeEditar={podeEditar}
              podeExcluir={podeExcluir}
            />
          ))
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50">
          <button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0"
            onClick={fecharModal}
          />
          <form
            onSubmit={salvar}
            className="relative flex h-full w-full max-w-2xl flex-col bg-[#f4f5f7] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  {editandoId ? "Editar site / rack" : "Novo site / rack"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Cadastre a estrutura física onde os ativos serão posicionados.
                </p>
              </div>
              <button
                type="button"
                onClick={fecharModal}
                className="p-2 text-slate-500 hover:text-slate-950"
              >
                <FiX size={21} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              <div className="grid gap-4 border border-slate-200 bg-white p-4 sm:grid-cols-2">
                <Campo label="Nome do site / rack" obrigatorio>
                  <input
                    name="nome"
                    value={formulario.nome}
                    onChange={alterarCampo}
                    className={inputClasse}
                    placeholder="Ex.: Site A — Rack Administrativo"
                  />
                </Campo>
                <Campo label="Código">
                  <input
                    name="codigo"
                    value={formulario.codigo}
                    onChange={alterarCampo}
                    className={inputClasse}
                    placeholder="Ex.: RACK-ADM-01"
                  />
                </Campo>
                <Campo label="Setor">
                  <select
                    name="setor_id"
                    value={formulario.setor_id}
                    onChange={alterarCampo}
                    className={inputClasse}
                  >
                    <option value="">Sem setor</option>
                    {setores.map((setor) => (
                      <option key={setor.id} value={setor.id}>
                        {setor.nome}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Status">
                  <select
                    name="status"
                    value={formulario.status}
                    onChange={alterarCampo}
                    className={inputClasse}
                  >
                    {opcoes.status_sites?.map((opcao) => (
                      <option key={opcao.value} value={opcao.value}>
                        {opcao.label}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Localização">
                  <input
                    name="localizacao"
                    value={formulario.localizacao}
                    onChange={alterarCampo}
                    className={inputClasse}
                    placeholder="Ex.: Sala do T.I., prédio administrativo"
                  />
                </Campo>
                <Campo label="Responsável">
                  <input
                    name="responsavel"
                    value={formulario.responsavel}
                    onChange={alterarCampo}
                    className={inputClasse}
                  />
                </Campo>
                <Campo label="Altura do rack">
                  <select
                    name="altura_u"
                    value={formulario.altura_u}
                    onChange={alterarCampo}
                    className={inputClasse}
                  >
                    {[6, 9, 12, 16, 20, 24, 32, 36, 42, 45, 47, 52].map((altura) => (
                      <option key={altura} value={altura}>
                        {altura}U
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Largura padrão">
                  <select
                    name="largura_polegadas"
                    value={formulario.largura_polegadas}
                    onChange={alterarCampo}
                    className={inputClasse}
                  >
                    <option value="10">10 polegadas</option>
                    <option value="19">19 polegadas</option>
                    <option value="23">23 polegadas</option>
                  </select>
                </Campo>
                <div className="sm:col-span-2">
                  <Campo label="Observações">
                    <textarea
                      name="observacoes"
                      value={formulario.observacoes}
                      onChange={alterarCampo}
                      className={`${inputClasse} min-h-28`}
                    />
                  </Campo>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={fecharModal}
                className="border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="bg-slate-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {salvando ? "Salvando..." : "Salvar site / rack"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
