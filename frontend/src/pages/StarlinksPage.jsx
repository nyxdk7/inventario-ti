import { useEffect, useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiEdit2,
  FiEye,
  FiMapPin,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiWifi,
  FiX,
} from "react-icons/fi";

import { apiRequest } from "../services/api";

const formularioInicial = {
  nome: "",
  email_conta: "",
  telefone: "",
  localizacao: "",
  plano: "",
  placa: "",
  numero_serie: "",
  modelo: "",
  status: "ativa",
  tipo_utilizacao: "fixa",
  responsavel: "",
  setor_id: "",
  equipamento_id: "",
  data_instalacao: "",
  data_ativacao: "",
  data_cancelamento: "",
  valor_mensalidade: "",
  centro_custo: "",
  observacoes: "",
  integracao_habilitada: false,
  account_id: "",
  starlink_id: "",
  user_terminal_id: "",
  service_line_id: "",
  kit_number: "",
};

const inputClasse = "w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5";

function formatarMoeda(valor) {
  if (valor === "" || valor === null || valor === undefined) return "-";
  const numero = Number(String(valor).replace(",", "."));
  if (Number.isNaN(numero)) return valor;
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function badgeStatus(status) {
  const classes = {
    ativa: "border-emerald-200 bg-emerald-50 text-emerald-700",
    cancelada: "border-red-200 bg-red-50 text-red-700",
    espera: "border-amber-200 bg-amber-50 text-amber-700",
    manutencao: "border-orange-200 bg-orange-50 text-orange-700",
    reserva: "border-slate-200 bg-slate-100 text-slate-700",
  };
  return classes[status] || classes.reserva;
}

function Aviso({ aviso, aoFechar }) {
  if (!aviso) return null;
  const erro = aviso.tipo === "erro";
  return (
    <div className={`mb-4 flex items-start justify-between gap-4 border p-4 text-sm ${erro ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
      <span>{aviso.texto}</span>
      <button type="button" onClick={aoFechar}><FiX size={17} /></button>
    </div>
  );
}

function ResumoCard({ titulo, valor, descricao, icone: Icone }) {
  return (
    <div className="border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{titulo}</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{valor ?? 0}</p>
          <p className="mt-1 text-sm text-slate-500">{descricao}</p>
        </div>
        <Icone size={22} className="mt-1 shrink-0 text-slate-400" />
      </div>
    </div>
  );
}

function Campo({ label, obrigatorio = false, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-slate-700">
        {label}{obrigatorio && <span className="text-red-600"> *</span>}
      </label>
      {children}
    </div>
  );
}

function Secao({ titulo, descricao, children }) {
  return (
    <section className="border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-4">
        <h3 className="text-sm font-black text-slate-950">{titulo}</h3>
        {descricao && <p className="mt-1 text-sm text-slate-500">{descricao}</p>}
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function StarlinkCard({ item, aoVer, aoEditar, aoExcluir, podeEditar, podeExcluir }) {
  return (
    <article className="border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <FiWifi size={20} className="text-slate-400" />
            <h3 className="truncate text-lg font-black text-slate-950">{item.nome}</h3>
            <span className={`inline-flex border px-2 py-1 text-xs font-bold ${badgeStatus(item.status)}`}>
              {item.status_display}
            </span>
          </div>

          <p className="mt-1 text-sm font-semibold text-slate-600">
            {item.modelo} · {item.plano || "Plano não informado"}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Localização</p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-800">{item.localizacao || "-"}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Utilização</p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-800">{item.tipo_utilizacao_display}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Responsável</p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-800">{item.responsavel || "-"}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Placa</p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-800">{item.placa || "Não se aplica"}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Série</p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-800">{item.numero_serie}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
            <span>{item.setor?.nome || "Sem setor"}</span>
            <span>{item.email_conta}</span>
            <span>{item.integracao_habilitada ? item.status_sincronizacao_display : "API não configurada"}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:min-w-36">
          <button type="button" onClick={() => aoVer(item.id)} className="flex items-center justify-center gap-2 border border-slate-950 bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800">
            <FiEye size={16} /> Ver detalhes
          </button>
          {podeEditar && (
            <button type="button" onClick={() => aoEditar(item)} className="flex items-center justify-center gap-2 border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100">
              <FiEdit2 size={16} /> Editar
            </button>
          )}
          {podeExcluir && (
            <button type="button" onClick={() => aoExcluir(item)} className="flex items-center justify-center gap-2 border border-red-200 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50">
              <FiTrash2 size={16} /> Excluir
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function StarlinksPage({ permissoes, aoVerDetalhes }) {
  const [starlinks, setStarlinks] = useState([]);
  const [setores, setSetores] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [opcoes, setOpcoes] = useState({ status: [], tipos_utilizacao: [] });
  const [resumo, setResumo] = useState({});
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [formulario, setFormulario] = useState(formularioInicial);
  const [editandoId, setEditandoId] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState(null);

  const podeEditar = permissoes?.podeEditarInventario ?? true;
  const podeExcluir = permissoes?.podeExcluir ?? true;

  const modelos = useMemo(() => [...new Set(starlinks.map((item) => item.modelo).filter(Boolean))].sort(), [starlinks]);

  async function carregarStarlinks() {
    setCarregando(true);
    try {
      const parametros = new URLSearchParams();
      if (busca.trim()) parametros.set("q", busca.trim());
      if (filtroStatus) parametros.set("status", filtroStatus);
      if (filtroTipo) parametros.set("tipo_utilizacao", filtroTipo);
      const sufixo = parametros.toString() ? `?${parametros.toString()}` : "";
      const dados = await apiRequest(`/starlinks/${sufixo}`);
      setStarlinks(dados.resultados || []);
      setResumo(dados.resumo || {});
      setOpcoes(dados.opcoes || { status: [], tipos_utilizacao: [] });
    } catch (erro) {
      setAviso({ tipo: "erro", texto: erro.message });
    } finally {
      setCarregando(false);
    }
  }

  async function carregarRelacionamentos() {
    try {
      const [dadosSetores, dadosEquipamentos] = await Promise.all([
        apiRequest("/setores/"),
        apiRequest("/equipamentos/"),
      ]);
      setSetores(dadosSetores.resultados || []);
      setEquipamentos(dadosEquipamentos.resultados || []);
    } catch (erro) {
      setAviso({ tipo: "erro", texto: erro.message });
    }
  }

  useEffect(() => {
    carregarRelacionamentos();
  }, []);

  useEffect(() => {
    const temporizador = window.setTimeout(carregarStarlinks, 250);
    return () => window.clearTimeout(temporizador);
  }, [busca, filtroStatus, filtroTipo]);

  function alterarCampo(evento) {
    const { name, value, type, checked } = evento.target;
    setFormulario((atual) => ({ ...atual, [name]: type === "checkbox" ? checked : value }));
  }

  function abrirNovo() {
    setFormulario(formularioInicial);
    setEditandoId(null);
    setAviso(null);
    setModalAberto(true);
  }

  async function abrirEdicao(item) {
    setAviso(null);
    try {
      const dados = await apiRequest(`/starlinks/${item.id}/`);
      const registro = dados.starlink;
      setFormulario({
        ...formularioInicial,
        ...registro,
        setor_id: registro.setor_id || "",
        equipamento_id: registro.equipamento_id || "",
      });
      setEditandoId(item.id);
      setModalAberto(true);
    } catch (erro) {
      setAviso({ tipo: "erro", texto: erro.message });
    }
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
      const endpoint = editandoId ? `/starlinks/${editandoId}/` : "/starlinks/";
      const metodo = editandoId ? "PUT" : "POST";
      const dados = await apiRequest(endpoint, {
        method: metodo,
        body: JSON.stringify(formulario),
      });
      setAviso({ tipo: "sucesso", texto: dados.mensagem });
      setModalAberto(false);
      setEditandoId(null);
      setFormulario(formularioInicial);
      await carregarStarlinks();
    } catch (erro) {
      const detalhes = erro.dados?.erro;
      const texto = typeof detalhes === "object"
        ? Object.values(detalhes).flat().join(" ")
        : erro.message;
      setAviso({ tipo: "erro", texto });
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(item) {
    if (!window.confirm(`Excluir a Starlink ${item.nome}?`)) return;
    try {
      const dados = await apiRequest(`/starlinks/${item.id}/`, { method: "DELETE" });
      setAviso({ tipo: "sucesso", texto: dados.mensagem });
      await carregarStarlinks();
    } catch (erro) {
      setAviso({ tipo: "erro", texto: erro.message });
    }
  }

  return (
    <div>
      <Aviso aviso={aviso} aoFechar={() => setAviso(null)} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-950">Starlinks da empresa</h2>
          <p className="mt-1 text-sm text-slate-500">Controle de assinaturas, kits, responsáveis, locais e futura telemetria.</p>
        </div>
        {podeEditar && (
          <button type="button" onClick={abrirNovo} className="flex items-center justify-center gap-2 bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800">
            <FiPlus size={17} /> Nova Starlink
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <ResumoCard titulo="Total" valor={resumo.total} descricao="Kits cadastrados" icone={FiWifi} />
        <ResumoCard titulo="Ativas" valor={resumo.ativas} descricao="Em operação" icone={FiWifi} />
        <ResumoCard titulo="Canceladas" valor={resumo.canceladas} descricao="Planos cancelados" icone={FiAlertTriangle} />
        <ResumoCard titulo="Em espera" valor={resumo.em_espera} descricao="Aguardando uso" icone={FiAlertTriangle} />
        <ResumoCard titulo="Móveis" valor={resumo.moveis} descricao="Veículos e máquinas" icone={FiMapPin} />
        <ResumoCard titulo="Sem local" valor={resumo.sem_localizacao} descricao="Requer revisão" icone={FiMapPin} />
      </div>

      <div className="mt-5 border border-slate-200 bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_240px]">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input value={busca} onChange={(evento) => setBusca(evento.target.value)} placeholder="Buscar por nome, e-mail, local, plano, série ou responsável" className={`${inputClasse} pl-10`} />
          </div>
          <select value={filtroStatus} onChange={(evento) => setFiltroStatus(evento.target.value)} className={inputClasse}>
            <option value="">Todos os status</option>
            {opcoes.status?.map((opcao) => <option key={opcao.value} value={opcao.value}>{opcao.label}</option>)}
          </select>
          <select value={filtroTipo} onChange={(evento) => setFiltroTipo(evento.target.value)} className={inputClasse}>
            <option value="">Todos os tipos de utilização</option>
            {opcoes.tipos_utilizacao?.map((opcao) => <option key={opcao.value} value={opcao.value}>{opcao.label}</option>)}
          </select>
        </div>
        {modelos.length > 0 && <p className="mt-3 text-xs text-slate-400">Modelos cadastrados: {modelos.join(", ")}</p>}
      </div>

      <div className="mt-5 space-y-3">
        {carregando ? (
          <div className="border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Carregando Starlinks...</div>
        ) : starlinks.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-white p-10 text-center">
            <FiWifi size={30} className="mx-auto text-slate-300" />
            <p className="mt-3 font-bold text-slate-700">Nenhuma Starlink encontrada</p>
            <p className="mt-1 text-sm text-slate-500">Cadastre o primeiro kit ou ajuste os filtros.</p>
          </div>
        ) : (
          starlinks.map((item) => (
            <StarlinkCard
              key={item.id}
              item={item}
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
          <button type="button" aria-label="Fechar" className="absolute inset-0" onClick={fecharModal} />
          <form onSubmit={salvar} className="relative flex h-full w-full max-w-3xl flex-col bg-[#f4f5f7] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-black text-slate-950">{editandoId ? "Editar Starlink" : "Nova Starlink"}</h2>
                <p className="mt-1 text-sm text-slate-500">A senha da conta não é armazenada neste cadastro.</p>
              </div>
              <button type="button" onClick={fecharModal} className="p-2 text-slate-500 hover:text-slate-950"><FiX size={21} /></button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
              <Secao titulo="Identificação" descricao="Informações principais do kit e da assinatura.">
                <Campo label="Nome identificador" obrigatorio><input name="nome" value={formulario.nome} onChange={alterarCampo} className={inputClasse} placeholder="Ex.: Starlink Pedreira" /></Campo>
                <Campo label="Modelo" obrigatorio><input name="modelo" value={formulario.modelo} onChange={alterarCampo} className={inputClasse} placeholder="Ex.: Starlink V3, Mini ou V2" /></Campo>
                <Campo label="Número de série" obrigatorio><input name="numero_serie" value={formulario.numero_serie} onChange={alterarCampo} className={inputClasse} /></Campo>
                <Campo label="E-mail da conta" obrigatorio><input type="email" name="email_conta" value={formulario.email_conta} onChange={alterarCampo} className={inputClasse} /></Campo>
                <Campo label="Telefone"><input name="telefone" value={formulario.telefone} onChange={alterarCampo} className={inputClasse} /></Campo>
                <Campo label="Plano"><input name="plano" value={formulario.plano} onChange={alterarCampo} className={inputClasse} placeholder="Ex.: Residencial ou Móvel 100 GB" /></Campo>
              </Secao>

              <Secao titulo="Uso e localização" descricao="Onde está instalado e quem é responsável.">
                <Campo label="Status"><select name="status" value={formulario.status} onChange={alterarCampo} className={inputClasse}>{opcoes.status?.map((opcao) => <option key={opcao.value} value={opcao.value}>{opcao.label}</option>)}</select></Campo>
                <Campo label="Tipo de utilização"><select name="tipo_utilizacao" value={formulario.tipo_utilizacao} onChange={alterarCampo} className={inputClasse}>{opcoes.tipos_utilizacao?.map((opcao) => <option key={opcao.value} value={opcao.value}>{opcao.label}</option>)}</select></Campo>
                <Campo label="Localização"><input name="localizacao" value={formulario.localizacao} onChange={alterarCampo} className={inputClasse} /></Campo>
                <Campo label="Placa"><input name="placa" value={formulario.placa} onChange={alterarCampo} className={inputClasse} placeholder="Deixe vazio quando não se aplicar" /></Campo>
                <Campo label="Responsável"><input name="responsavel" value={formulario.responsavel} onChange={alterarCampo} className={inputClasse} /></Campo>
                <Campo label="Setor"><select name="setor_id" value={formulario.setor_id} onChange={alterarCampo} className={inputClasse}><option value="">Sem setor</option>{setores.map((setor) => <option key={setor.id} value={setor.id}>{setor.nome}</option>)}</select></Campo>
                <Campo label="Equipamento relacionado"><select name="equipamento_id" value={formulario.equipamento_id} onChange={alterarCampo} className={inputClasse}><option value="">Sem equipamento vinculado</option>{equipamentos.map((equipamento) => <option key={equipamento.id} value={equipamento.id}>{equipamento.tipo_display} · {[equipamento.marca, equipamento.modelo, equipamento.patrimonio].filter(Boolean).join(" ") || `ID ${equipamento.id}`}</option>)}</select></Campo>
                <Campo label="Centro de custo"><input name="centro_custo" value={formulario.centro_custo} onChange={alterarCampo} className={inputClasse} /></Campo>
              </Secao>

              <Secao titulo="Datas e cobrança" descricao="Controle administrativo da instalação.">
                <Campo label="Data de instalação"><input type="date" name="data_instalacao" value={formulario.data_instalacao} onChange={alterarCampo} className={inputClasse} /></Campo>
                <Campo label="Data de ativação"><input type="date" name="data_ativacao" value={formulario.data_ativacao} onChange={alterarCampo} className={inputClasse} /></Campo>
                <Campo label="Data de cancelamento"><input type="date" name="data_cancelamento" value={formulario.data_cancelamento} onChange={alterarCampo} className={inputClasse} /></Campo>
                <Campo label="Mensalidade"><input name="valor_mensalidade" value={formulario.valor_mensalidade} onChange={alterarCampo} className={inputClasse} placeholder="Ex.: 350,00" /></Campo>
                <div className="sm:col-span-2"><Campo label="Observações"><textarea name="observacoes" value={formulario.observacoes} onChange={alterarCampo} className={`${inputClasse} min-h-24`} /></Campo></div>
              </Secao>

              <Secao titulo="Integração Starlink" descricao="Campos preparados para a futura Management e Telemetry API.">
                <label className="sm:col-span-2 flex items-center gap-3 border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
                  <input type="checkbox" name="integracao_habilitada" checked={formulario.integracao_habilitada} onChange={alterarCampo} className="h-4 w-4" />
                  Marcar este cadastro como preparado para sincronização por API
                </label>
                {formulario.integracao_habilitada && (
                  <>
                    <Campo label="Account ID"><input name="account_id" value={formulario.account_id} onChange={alterarCampo} className={inputClasse} /></Campo>
                    <Campo label="Starlink ID"><input name="starlink_id" value={formulario.starlink_id} onChange={alterarCampo} className={inputClasse} /></Campo>
                    <Campo label="User Terminal ID"><input name="user_terminal_id" value={formulario.user_terminal_id} onChange={alterarCampo} className={inputClasse} /></Campo>
                    <Campo label="Service Line ID"><input name="service_line_id" value={formulario.service_line_id} onChange={alterarCampo} className={inputClasse} /></Campo>
                    <Campo label="Kit Number"><input name="kit_number" value={formulario.kit_number} onChange={alterarCampo} className={inputClasse} /></Campo>
                  </>
                )}
              </Secao>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <button type="button" onClick={fecharModal} className="border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100">Cancelar</button>
              <button type="submit" disabled={salvando} className="bg-slate-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60">{salvando ? "Salvando..." : "Salvar Starlink"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
