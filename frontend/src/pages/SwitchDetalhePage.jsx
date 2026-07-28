import { useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiClock,
  FiEdit2,
  FiGitBranch,
  FiLink,
  FiMapPin,
  FiRefreshCw,
  FiServer,
  FiX,
  FiZap,
} from "react-icons/fi";

import { apiRequest } from "../services/api";

const formularioPortaInicial = {
  nome: "",
  tipo_dispositivo: "",
  status: "livre",
  tipo_vinculo: "manual",
  computador_id: "",
  equipamento_id: "",
  switch_destino_id: "",
  descricao_dispositivo: "",
  usuario_responsavel: "",
  setor_id: "",
  ip_conectado: "",
  mac_conectado: "",
  vlan: "",
  perfil: "",
  velocidade: "auto",
  poe: false,
  observacoes: "",
};

const inputClasse =
  "w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5";

function corPorta(status) {
  if (status === "ativa") return "border-emerald-500 bg-emerald-500 text-white";
  if (status === "uplink") return "border-blue-500 bg-blue-500 text-white";
  if (status === "desconectada") return "border-slate-400 bg-slate-400 text-white";
  if (status === "bloqueada") return "border-amber-400 bg-amber-300 text-slate-900";
  if (status === "defeituosa") return "border-red-500 bg-red-500 text-white";
  return "border-slate-300 bg-white text-slate-500";
}

function Legenda({ status, texto }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
      <span className={`h-3 w-3 border ${corPorta(status)}`} />
      {texto}
    </div>
  );
}

function ResumoCard({ titulo, valor, descricao, Icone }) {
  return (
    <div className="border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{titulo}</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{valor}</p>
          <p className="mt-1 text-sm text-slate-500">{descricao}</p>
        </div>
        <Icone size={22} className="shrink-0 text-slate-400" />
      </div>
    </div>
  );
}

function Campo({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function textoDispositivo(porta) {
  return porta.descricao_conexao || porta.nome || "Porta livre";
}

function PortaVisual({ porta, aoSelecionar }) {
  return (
    <button
      type="button"
      onClick={() => aoSelecionar(porta)}
      title={`Porta ${porta.numero} · ${porta.status_display} · ${textoDispositivo(porta)}`}
      className={`group relative flex h-14 w-14 shrink-0 flex-col items-center justify-center border text-xs font-black transition hover:-translate-y-0.5 hover:shadow-md ${corPorta(porta.status)}`}
    >
      <span>{porta.numero}</span>
      <span className="mt-0.5 text-[8px] font-bold uppercase opacity-80">
        {porta.tipo_porta === "sfp" ? "SFP" : "RJ45"}
      </span>
      {porta.poe && <FiZap size={10} className="absolute right-1 top-1" />}
    </button>
  );
}

function MapaPortas({ portas, aoSelecionar }) {
  const ordenadas = [...portas].sort((a, b) => a.numero - b.numero);
  const impares = ordenadas.filter((porta) => porta.numero % 2 !== 0);
  const pares = ordenadas.filter((porta) => porta.numero % 2 === 0);
  const colunas = Math.max(impares.length, pares.length);
  const largura = Math.max(760, colunas * 64 + 80);

  return (
    <div className="overflow-x-auto border border-slate-800 bg-[#111827] p-5">
      <div style={{ minWidth: `${largura}px` }}>
        <div className="mb-4 flex items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-3">
            <FiServer size={22} />
            <div>
              <p className="text-sm font-black">Mapa físico das portas</p>
              <p className="text-xs text-slate-400">Clique numa porta para consultar ou editar</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="h-2 w-2 bg-emerald-400" />
            ONLINE
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            {impares.map((porta) => <PortaVisual key={porta.id} porta={porta} aoSelecionar={aoSelecionar} />)}
          </div>
          <div className="flex gap-2">
            {pares.map((porta) => <PortaVisual key={porta.id} porta={porta} aoSelecionar={aoSelecionar} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function LinhaPorta({ porta, aoSelecionar }) {
  return (
    <button
      type="button"
      onClick={() => aoSelecionar(porta)}
      className="grid w-full gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 md:grid-cols-[70px_1.3fr_1fr_1fr_1fr_110px] md:items-center"
    >
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center border text-xs font-black ${corPorta(porta.status)}`}>
          {porta.numero}
        </span>
        <span className="text-xs font-bold text-slate-400">{porta.tipo_porta_display}</span>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-900">{textoDispositivo(porta)}</p>
        <p className="truncate text-xs text-slate-500">{porta.tipo_dispositivo_display || "Sem tipo definido"}</p>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Responsável / setor</p>
        <p className="mt-1 truncate text-sm text-slate-700">
          {[porta.usuario_responsavel, porta.setor?.nome].filter(Boolean).join(" · ") || "-"}
        </p>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">IP / MAC</p>
        <p className="mt-1 truncate text-sm text-slate-700">{porta.ip_conectado || "-"}</p>
        <p className="truncate text-xs text-slate-400">{porta.mac_conectado || "-"}</p>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">VLAN / perfil</p>
        <p className="mt-1 truncate text-sm text-slate-700">
          {[porta.vlan, porta.perfil].filter(Boolean).join(" · ") || "-"}
        </p>
      </div>
      <div className="md:text-right">
        <span className="inline-flex border border-slate-200 px-2 py-1 text-xs font-bold text-slate-600">
          {porta.status_display}
        </span>
      </div>
    </button>
  );
}

export default function SwitchDetalhePage({ switchId, aoVoltar, permissoes }) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [portaSelecionada, setPortaSelecionada] = useState(null);
  const [formulario, setFormulario] = useState(formularioPortaInicial);
  const [filtroStatus, setFiltroStatus] = useState("");
  const [busca, setBusca] = useState("");

  const podeEditar = permissoes?.podeEditarInventario ?? true;

  async function carregar() {
    setCarregando(true);
    setErro("");
    try {
      const resposta = await apiRequest(`/switches/${switchId}/`);
      setDados(resposta);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [switchId]);

  const portasFiltradas = useMemo(() => {
    const portas = dados?.switch?.portas || [];
    return portas.filter((porta) => {
      if (filtroStatus && porta.status !== filtroStatus) return false;
      if (!busca.trim()) return true;
      const termo = busca.toLowerCase();
      return [
        porta.numero,
        porta.nome,
        porta.descricao_conexao,
        porta.usuario_responsavel,
        porta.setor?.nome,
        porta.ip_conectado,
        porta.mac_conectado,
        porta.vlan,
        porta.perfil,
      ].some((valor) => String(valor || "").toLowerCase().includes(termo));
    });
  }, [dados, filtroStatus, busca]);

  function identificarVinculo(porta) {
    if (porta.computador_id) return "computador";
    if (porta.equipamento_id) return "equipamento";
    if (porta.switch_destino_id) return "switch";
    return "manual";
  }

  function selecionarPorta(porta) {
    setPortaSelecionada(porta);
    setFormulario({
      nome: porta.nome || "",
      tipo_dispositivo: porta.tipo_dispositivo || "",
      status: porta.status || "livre",
      tipo_vinculo: identificarVinculo(porta),
      computador_id: porta.computador_id || "",
      equipamento_id: porta.equipamento_id || "",
      switch_destino_id: porta.switch_destino_id || "",
      descricao_dispositivo: porta.descricao_dispositivo || "",
      usuario_responsavel: porta.usuario_responsavel || "",
      setor_id: porta.setor_id || "",
      ip_conectado: porta.ip_conectado || "",
      mac_conectado: porta.mac_conectado || "",
      vlan: porta.vlan || "",
      perfil: porta.perfil || "",
      velocidade: porta.velocidade || "auto",
      poe: Boolean(porta.poe),
      observacoes: porta.observacoes || "",
    });
  }

  function fecharPainel() {
    if (salvando) return;
    setPortaSelecionada(null);
    setFormulario(formularioPortaInicial);
  }

  function alterarCampo(evento) {
    const { name, value, type, checked } = evento.target;
    setFormulario((atual) => ({ ...atual, [name]: type === "checkbox" ? checked : value }));
  }

  function alterarTipoVinculo(evento) {
    const tipo = evento.target.value;
    setFormulario((atual) => ({
      ...atual,
      tipo_vinculo: tipo,
      computador_id: "",
      equipamento_id: "",
      switch_destino_id: "",
    }));
  }

  async function salvarPorta(evento) {
    evento.preventDefault();
    if (!portaSelecionada || !podeEditar) return;

    setSalvando(true);
    setErro("");
    try {
      const payload = {
        ...formulario,
        computador_id: formulario.tipo_vinculo === "computador" ? formulario.computador_id : "",
        equipamento_id: formulario.tipo_vinculo === "equipamento" ? formulario.equipamento_id : "",
        switch_destino_id: formulario.tipo_vinculo === "switch" ? formulario.switch_destino_id : "",
      };
      const resposta = await apiRequest(`/switches/portas/${portaSelecionada.id}/`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setPortaSelecionada(null);
      setFormulario(formularioPortaInicial);
      await carregar();
      window.setTimeout(() => window.alert(resposta.mensagem), 50);
    } catch (falha) {
      setErro(typeof falha.dados?.erro === "object" ? JSON.stringify(falha.dados.erro) : falha.message);
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return <div className="border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Carregando switch...</div>;
  }

  if (!dados?.switch) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={aoVoltar} className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <FiArrowLeft /> Voltar
        </button>
        <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">{erro || "Switch não encontrado."}</div>
      </div>
    );
  }

  const item = dados.switch;
  const resumo = item.resumo_portas || {};
  const opcoes = dados.opcoes || {};

  return (
    <div className="space-y-5">
      {erro && (
        <div className="flex items-start justify-between gap-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{erro}</span>
          <button type="button" onClick={() => setErro("")}><FiX /></button>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button type="button" onClick={aoVoltar} className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950">
            <FiArrowLeft size={17} /> Voltar para switches
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <FiServer size={25} className="text-slate-400" />
            <h2 className="text-2xl font-black text-slate-950">{item.nome}</h2>
            <span className="border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-600">{item.status_display}</span>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {[item.marca, item.modelo, item.ip_gerenciamento].filter(Boolean).join(" · ") || "Detalhes do switch"}
          </p>
        </div>

        <button type="button" onClick={carregar} className="flex items-center justify-center gap-2 border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100">
          <FiRefreshCw size={16} /> Atualizar
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ResumoCard titulo="Portas" valor={resumo.total || 0} descricao={`${item.quantidade_portas_sfp || 0} SFP/SFP+`} Icone={FiGitBranch} />
        <ResumoCard titulo="Em uso" valor={resumo.ativas || 0} descricao="Ativas ou uplink" Icone={FiLink} />
        <ResumoCard titulo="Livres" valor={resumo.livres || 0} descricao="Disponíveis para uso" Icone={FiServer} />
        <ResumoCard titulo="Atenção" valor={resumo.atencao || 0} descricao="Bloqueadas, desconectadas ou com defeito" Icone={FiZap} />
      </div>

      <div className="grid gap-3 border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Setor</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{item.setor?.nome || "-"}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Localização</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{item.localizacao || "-"}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Rack</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{item.rack || "-"}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Patrimônio</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{item.patrimonio || "-"}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Série</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{item.numero_serie || "-"}</p>
        </div>
      </div>

      <MapaPortas portas={item.portas || []} aoSelecionar={selecionarPorta} />

      <div className="flex flex-wrap gap-x-5 gap-y-2 border border-slate-200 bg-white px-4 py-3">
        <Legenda status="ativa" texto="Ativa" />
        <Legenda status="uplink" texto="Uplink" />
        <Legenda status="livre" texto="Livre" />
        <Legenda status="desconectada" texto="Desconectada" />
        <Legenda status="bloqueada" texto="Bloqueada" />
        <Legenda status="defeituosa" texto="Defeituosa" />
      </div>

      <section className="border border-slate-200 bg-white">
        <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[1fr_220px]">
          <input value={busca} onChange={(evento) => setBusca(evento.target.value)} placeholder="Buscar porta, dispositivo, IP, MAC, VLAN ou responsável" className={inputClasse} />
          <select value={filtroStatus} onChange={(evento) => setFiltroStatus(evento.target.value)} className={inputClasse}>
            <option value="">Todos os status</option>
            {(opcoes.status_porta || []).map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
        </div>
        <div className="hidden border-b border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-400 md:grid md:grid-cols-[70px_1.3fr_1fr_1fr_1fr_110px]">
          <span>Porta</span><span>Dispositivo</span><span>Responsável</span><span>Rede</span><span>VLAN</span><span className="text-right">Status</span>
        </div>
        <div>
          {portasFiltradas.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">Nenhuma porta encontrada com os filtros aplicados.</div>
          ) : portasFiltradas.map((porta) => <LinhaPorta key={porta.id} porta={porta} aoSelecionar={selecionarPorta} />)}
        </div>
      </section>

      <section className="border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
          <FiClock className="text-slate-400" />
          <h3 className="text-sm font-black text-slate-950">Alterações recentes nas portas</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {(dados.historico || []).length === 0 ? (
            <div className="p-6 text-sm text-slate-500">Nenhuma alteração registrada ainda.</div>
          ) : (dados.historico || []).slice(0, 15).map((registro) => (
            <div key={registro.id} className="px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">{registro.resumo}</p>
              <p className="mt-1 text-xs text-slate-400">{registro.criado_em} · {registro.alterado_por || "Sistema"}</p>
            </div>
          ))}
        </div>
      </section>

      {portaSelecionada && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/45" onClick={fecharPainel} />
          <div className="relative flex h-full w-full max-w-2xl flex-col bg-[#f4f5f7] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center border font-black ${corPorta(portaSelecionada.status)}`}>{portaSelecionada.numero}</span>
                  <div>
                    <h3 className="text-lg font-black text-slate-950">Porta {portaSelecionada.numero}</h3>
                    <p className="text-sm text-slate-500">{portaSelecionada.tipo_porta_display} · {portaSelecionada.status_display}</p>
                  </div>
                </div>
              </div>
              <button type="button" onClick={fecharPainel} className="text-slate-500 hover:text-slate-950"><FiX size={22} /></button>
            </div>

            <form onSubmit={salvarPorta} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
                {!podeEditar && (
                  <div className="border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">Seu perfil possui acesso somente para consulta.</div>
                )}

                <section className="border border-slate-200 bg-white p-4">
                  <h4 className="mb-4 text-sm font-black text-slate-950">Identificação da porta</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Campo label="Nome amigável"><input disabled={!podeEditar} name="nome" value={formulario.nome} onChange={alterarCampo} className={inputClasse} placeholder="Ex.: Financeiro 01" /></Campo>
                    <Campo label="Status">
                      <select disabled={!podeEditar} name="status" value={formulario.status} onChange={alterarCampo} className={inputClasse}>
                        {(opcoes.status_porta || []).map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                      </select>
                    </Campo>
                    <Campo label="Tipo de dispositivo">
                      <select disabled={!podeEditar} name="tipo_dispositivo" value={formulario.tipo_dispositivo} onChange={alterarCampo} className={inputClasse}>
                        <option value="">Não informado</option>
                        {(opcoes.tipos_dispositivo || []).map((tipo) => <option key={tipo.value} value={tipo.value}>{tipo.label}</option>)}
                      </select>
                    </Campo>
                    <Campo label="Velocidade">
                      <select disabled={!podeEditar} name="velocidade" value={formulario.velocidade} onChange={alterarCampo} className={inputClasse}>
                        {(opcoes.velocidades || []).map((velocidade) => <option key={velocidade.value} value={velocidade.value}>{velocidade.label}</option>)}
                      </select>
                    </Campo>
                  </div>
                  <label className="mt-4 flex items-center gap-3 text-sm font-semibold text-slate-700">
                    <input disabled={!podeEditar} type="checkbox" name="poe" checked={formulario.poe} onChange={alterarCampo} className="h-4 w-4" />
                    Porta fornece PoE
                  </label>
                </section>

                <section className="border border-slate-200 bg-white p-4">
                  <h4 className="mb-4 text-sm font-black text-slate-950">Relacionamento com o inventário</h4>
                  <Campo label="Origem do dispositivo">
                    <select disabled={!podeEditar} name="tipo_vinculo" value={formulario.tipo_vinculo} onChange={alterarTipoVinculo} className={inputClasse}>
                      <option value="manual">Descrição manual</option>
                      <option value="computador">Computador cadastrado</option>
                      <option value="equipamento">Equipamento cadastrado</option>
                      <option value="switch">Outro switch / uplink</option>
                    </select>
                  </Campo>

                  <div className="mt-4">
                    {formulario.tipo_vinculo === "computador" && (
                      <Campo label="Computador">
                        <select disabled={!podeEditar} name="computador_id" value={formulario.computador_id} onChange={alterarCampo} className={inputClasse}>
                          <option value="">Selecione</option>
                          {(opcoes.computadores || []).map((computador) => (
                            <option key={computador.id} value={computador.id}>{computador.nome_usuario} · {computador.ip_computador} · {computador.setor || "Sem setor"}</option>
                          ))}
                        </select>
                      </Campo>
                    )}

                    {formulario.tipo_vinculo === "equipamento" && (
                      <Campo label="Equipamento">
                        <select disabled={!podeEditar} name="equipamento_id" value={formulario.equipamento_id} onChange={alterarCampo} className={inputClasse}>
                          <option value="">Selecione</option>
                          {(opcoes.equipamentos || []).map((equipamento) => (
                            <option key={equipamento.id} value={equipamento.id}>
                              {[equipamento.tipo_display, equipamento.marca, equipamento.modelo, equipamento.patrimonio].filter(Boolean).join(" · ")}
                            </option>
                          ))}
                        </select>
                      </Campo>
                    )}

                    {formulario.tipo_vinculo === "switch" && (
                      <Campo label="Switch conectado">
                        <select disabled={!podeEditar} name="switch_destino_id" value={formulario.switch_destino_id} onChange={alterarCampo} className={inputClasse}>
                          <option value="">Selecione</option>
                          {(opcoes.switches || []).map((switchItem) => (
                            <option key={switchItem.id} value={switchItem.id}>{switchItem.nome} · {switchItem.ip_gerenciamento || "Sem IP"}</option>
                          ))}
                        </select>
                      </Campo>
                    )}

                    {formulario.tipo_vinculo === "manual" && (
                      <Campo label="Descrição do dispositivo">
                        <input disabled={!podeEditar} name="descricao_dispositivo" value={formulario.descricao_dispositivo} onChange={alterarCampo} className={inputClasse} placeholder="Ex.: Câmera do portão principal" />
                      </Campo>
                    )}
                  </div>
                </section>

                <section className="border border-slate-200 bg-white p-4">
                  <h4 className="mb-4 text-sm font-black text-slate-950">Usuário e rede</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Campo label="Responsável / usuário"><input disabled={!podeEditar} name="usuario_responsavel" value={formulario.usuario_responsavel} onChange={alterarCampo} className={inputClasse} /></Campo>
                    <Campo label="Setor">
                      <select disabled={!podeEditar} name="setor_id" value={formulario.setor_id} onChange={alterarCampo} className={inputClasse}>
                        <option value="">Sem setor</option>
                        {(opcoes.setores || []).map((setor) => <option key={setor.id} value={setor.id}>{setor.nome}</option>)}
                      </select>
                    </Campo>
                    <Campo label="IP conectado"><input disabled={!podeEditar} name="ip_conectado" value={formulario.ip_conectado} onChange={alterarCampo} className={inputClasse} placeholder="192.168.1.50" /></Campo>
                    <Campo label="MAC conectado"><input disabled={!podeEditar} name="mac_conectado" value={formulario.mac_conectado} onChange={alterarCampo} className={inputClasse} placeholder="AA:BB:CC:DD:EE:FF" /></Campo>
                    <Campo label="VLAN"><input disabled={!podeEditar} name="vlan" value={formulario.vlan} onChange={alterarCampo} className={inputClasse} placeholder="VLAN Financeiro" /></Campo>
                    <Campo label="Perfil da porta"><input disabled={!podeEditar} name="perfil" value={formulario.perfil} onChange={alterarCampo} className={inputClasse} placeholder="Access / Trunk / Perfil" /></Campo>
                  </div>
                </section>

                <section className="border border-slate-200 bg-white p-4">
                  <Campo label="Observações"><textarea disabled={!podeEditar} name="observacoes" value={formulario.observacoes} onChange={alterarCampo} rows="4" className={inputClasse} /></Campo>
                </section>
              </div>

              <div className="flex shrink-0 gap-3 border-t border-slate-200 bg-white p-4">
                <button type="button" onClick={fecharPainel} className="flex-1 border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100">Fechar</button>
                {podeEditar && (
                  <button type="submit" disabled={salvando} className="flex flex-1 items-center justify-center gap-2 border border-slate-950 bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60">
                    <FiEdit2 size={16} /> {salvando ? "Salvando..." : "Salvar porta"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
