import { useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiBox,
  FiCpu,
  FiEdit2,
  FiGrid,
  FiHardDrive,
  FiInfo,
  FiLayers,
  FiPlus,
  FiRefreshCw,
  FiServer,
  FiShield,
  FiTool,
  FiTrash2,
  FiWifi,
  FiX,
  FiZap,
} from "react-icons/fi";

import { apiRequest } from "../services/api";

const inputClasse =
  "w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5";

const ativoInicial = {
  nome: "",
  tipo: "switch",
  tipo_outro_descricao: "",
  lado: "frente",
  posicao_u: "1",
  altura_u: "1",
  marca: "",
  modelo: "",
  patrimonio: "",
  numero_serie: "",
  ip_gerenciamento: "",
  mac_address: "",
  status: "ativo",
  equipamento_id: "",
  switch_rede_id: "",
  observacoes: "",
  patch_panel: {
    quantidade_portas: "24",
    categoria: "cat6",
    tipo_conector: "rj45",
    identificacao: "",
    observacoes: "",
  },
};

const portaInicial = {
  status: "livre",
  identificacao: "",
  ponto_logico: "",
  local_destino: "",
  setor_id: "",
  computador_id: "",
  equipamento_id: "",
  switch_porta_id: "",
  observacoes: "",
};

function tipoConfig(tipo) {
  const configuracoes = {
    switch: { icone: FiServer, classe: "border-sky-500 bg-sky-950 text-sky-100", detalhe: "bg-sky-400" },
    patch_panel: { icone: FiGrid, classe: "border-emerald-500 bg-emerald-950 text-emerald-100", detalhe: "bg-emerald-400" },
    roteador: { icone: FiWifi, classe: "border-indigo-500 bg-indigo-950 text-indigo-100", detalhe: "bg-indigo-400" },
    firewall: { icone: FiShield, classe: "border-red-500 bg-red-950 text-red-100", detalhe: "bg-red-400" },
    servidor: { icone: FiCpu, classe: "border-violet-500 bg-violet-950 text-violet-100", detalhe: "bg-violet-400" },
    nobreak: { icone: FiZap, classe: "border-amber-500 bg-amber-950 text-amber-100", detalhe: "bg-amber-400" },
    modem: { icone: FiWifi, classe: "border-cyan-500 bg-cyan-950 text-cyan-100", detalhe: "bg-cyan-400" },
    dvr_nvr: { icone: FiHardDrive, classe: "border-fuchsia-500 bg-fuchsia-950 text-fuchsia-100", detalhe: "bg-fuchsia-400" },
    organizador: { icone: FiLayers, classe: "border-slate-500 bg-slate-800 text-slate-100", detalhe: "bg-slate-400" },
    bandeja: { icone: FiBox, classe: "border-stone-500 bg-stone-800 text-stone-100", detalhe: "bg-stone-400" },
    conversor: { icone: FiRefreshCw, classe: "border-teal-500 bg-teal-950 text-teal-100", detalhe: "bg-teal-400" },
    outro: { icone: FiBox, classe: "border-slate-500 bg-slate-900 text-slate-100", detalhe: "bg-slate-400" },
  };
  return configuracoes[tipo] || configuracoes.outro;
}

function badgeStatus(status) {
  const classes = {
    ativo: "border-emerald-200 bg-emerald-50 text-emerald-700",
    planejamento: "border-sky-200 bg-sky-50 text-sky-700",
    reserva: "border-slate-200 bg-slate-100 text-slate-600",
    manutencao: "border-amber-200 bg-amber-50 text-amber-700",
    inativo: "border-slate-200 bg-slate-100 text-slate-600",
  };
  return classes[status] || classes.inativo;
}

function corPorta(status) {
  const classes = {
    livre: "border-slate-300 bg-white text-slate-500",
    em_uso: "border-emerald-600 bg-emerald-500 text-white",
    reserva: "border-amber-500 bg-amber-400 text-slate-950",
    defeituosa: "border-red-600 bg-red-500 text-white",
  };
  return classes[status] || classes.livre;
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

function Info({ titulo, valor, icone: Icone }) {
  return (
    <div className="border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        {Icone && <Icone size={18} className="mt-0.5 shrink-0 text-slate-400" />}
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{titulo}</p>
          <p className="mt-1 break-words text-sm font-semibold text-slate-800">{valor || "-"}</p>
        </div>
      </div>
    </div>
  );
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

function RackVisual({ site, lado, ativoSelecionadoId, aoSelecionar }) {
  const unidadePx = 30;
  const altura = site.altura_u * unidadePx;
  const ativos = site.ativos.filter((ativo) => ativo.lado === lado);
  const linhas = Array.from({ length: site.altura_u }, (_, indice) => site.altura_u - indice);

  return (
    <div className="overflow-x-auto">
      <div className="mx-auto min-w-[560px] max-w-3xl border-x-[10px] border-y-[14px] border-slate-800 bg-slate-950 p-2 shadow-xl">
        <div className="mb-2 flex items-center justify-between border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300">
          <span className="font-bold uppercase tracking-[0.22em]">{site.nome}</span>
          <span>{lado === "frente" ? "Vista frontal" : "Vista traseira"}</span>
        </div>

        <div className="relative border border-slate-700 bg-slate-900" style={{ height }}>
          {linhas.map((numero, indice) => (
            <div
              key={numero}
              className="absolute left-0 right-0 border-t border-slate-700/70"
              style={{ top: indice * unidadePx, height: unidadePx }}
            >
              <span className="absolute left-1 top-1 text-[9px] font-bold text-slate-500">U{numero}</span>
              <span className="absolute right-1 top-1 text-[9px] font-bold text-slate-500">U{numero}</span>
            </div>
          ))}

          {ativos.map((ativo) => {
            const config = tipoConfig(ativo.tipo);
            const Icone = config.icone;
            const bottom = (ativo.posicao_u - 1) * unidadePx;
            const alturaAtivo = ativo.altura_u * unidadePx - 2;
            const selecionado = ativoSelecionadoId === ativo.id;

            return (
              <button
                key={ativo.id}
                type="button"
                onClick={() => aoSelecionar(ativo)}
                className={`absolute left-10 right-10 overflow-hidden border text-left shadow-md transition ${config.classe} ${
                  selecionado ? "ring-2 ring-white ring-offset-2 ring-offset-slate-950" : "hover:brightness-110"
                }`}
                style={{ bottom, height: alturaAtivo }}
                title={`${ativo.nome} — U${ativo.posicao_u} até U${ativo.posicao_u_final}`}
              >
                <div className="flex h-full items-center gap-3 px-3">
                  <Icone size={Math.min(20 + ativo.altura_u * 2, 30)} className="shrink-0 opacity-90" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-xs font-black uppercase tracking-wide sm:text-sm">
                        {ativo.nome}
                      </p>
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${config.detalhe}`} />
                    </div>
                    {alturaAtivo >= 48 && (
                      <p className="mt-0.5 truncate text-[10px] opacity-75">
                        {ativo.tipo_display} · {[ativo.marca, ativo.modelo].filter(Boolean).join(" ") || "Sem modelo"}
                      </p>
                    )}
                    {ativo.tipo === "patch_panel" && alturaAtivo >= 25 && (
                      <div className="mt-1 flex flex-wrap gap-0.5">
                        {Array.from({ length: Math.min(ativo.patch_panel?.quantidade_portas || 0, 24) }).map((_, indice) => {
                          const porta = ativo.patch_panel?.portas?.[indice];
                          return (
                            <span
                              key={indice}
                              className={`h-1.5 w-2 border border-white/20 ${
                                porta?.status === "em_uso"
                                  ? "bg-emerald-400"
                                  : porta?.status === "defeituosa"
                                    ? "bg-red-400"
                                    : porta?.status === "reserva"
                                      ? "bg-amber-300"
                                      : "bg-slate-500"
                              }`}
                            />
                          );
                        })}
                      </div>
                    )}
                    {ativo.tipo === "switch" && alturaAtivo >= 25 && (
                      <div className="mt-1 flex gap-0.5">
                        {Array.from({ length: 12 }).map((_, indice) => (
                          <span
                            key={indice}
                            className={`h-1.5 w-2 border border-white/20 ${indice < 7 ? "bg-emerald-400" : "bg-slate-600"}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="shrink-0 text-[10px] font-bold opacity-75">
                    U{ativo.posicao_u}
                    {ativo.altura_u > 1 ? `–${ativo.posicao_u_final}` : ""}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex items-center justify-between border border-slate-700 bg-slate-900 px-3 py-2 text-[10px] text-slate-400">
          <span>Rack padrão {site.largura_polegadas}”</span>
          <span>{site.altura_u} unidades de rack</span>
        </div>
      </div>
    </div>
  );
}

function PatchPanelPortas({ patchPanel, aoSelecionarPorta }) {
  if (!patchPanel) return null;
  return (
    <div className="border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="font-black text-slate-950">Mapa do patch panel</h4>
          <p className="mt-1 text-sm text-slate-500">
            {patchPanel.quantidade_portas} portas · {patchPanel.categoria_display} · {patchPanel.tipo_conector_display}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
          <span>{patchPanel.resumo?.em_uso || 0} em uso</span>
          <span>{patchPanel.resumo?.livres || 0} livres</span>
          <span>{patchPanel.resumo?.reserva || 0} reserva</span>
          <span>{patchPanel.resumo?.defeituosas || 0} defeituosas</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-8 xl:grid-cols-12">
        {patchPanel.portas.map((porta) => (
          <button
            key={porta.id}
            type="button"
            onClick={() => aoSelecionarPorta(porta)}
            className={`relative aspect-[1.2/1] border p-1 text-center text-xs font-black transition hover:-translate-y-0.5 hover:shadow ${corPorta(porta.status)}`}
            title={[porta.identificacao, porta.ponto_logico, porta.local_destino].filter(Boolean).join(" · ") || `Porta ${porta.numero}`}
          >
            <span>{porta.numero}</span>
            {porta.switch_porta && (
              <span className="absolute bottom-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-sky-700" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 border border-slate-300 bg-white" /> Livre</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 bg-emerald-500" /> Em uso</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 bg-amber-400" /> Reserva</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 bg-red-500" /> Defeituosa</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sky-700" /> Ligada ao switch</span>
      </div>
    </div>
  );
}

export default function SiteDetalhePage({ siteId, aoVoltar, aoAbrirSwitch, permissoes }) {
  const [site, setSite] = useState(null);
  const [opcoes, setOpcoes] = useState({});
  const [relacionamentos, setRelacionamentos] = useState({
    setores: [],
    equipamentos: [],
    equipamentos_portas: [],
    switches: [],
    computadores: [],
    switch_portas: [],
  });
  const [lado, setLado] = useState("frente");
  const [ativoSelecionado, setAtivoSelecionado] = useState(null);
  const [modalAtivoAberto, setModalAtivoAberto] = useState(false);
  const [formularioAtivo, setFormularioAtivo] = useState(ativoInicial);
  const [editandoAtivoId, setEditandoAtivoId] = useState(null);
  const [portaSelecionada, setPortaSelecionada] = useState(null);
  const [formularioPorta, setFormularioPorta] = useState(portaInicial);
  const [modalPortaAberto, setModalPortaAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState(null);

  const podeEditar = permissoes?.podeEditarInventario ?? true;
  const podeExcluir = permissoes?.podeExcluir ?? true;

  async function carregarSite() {
    setCarregando(true);
    try {
      const dados = await apiRequest(`/sites/${siteId}/`);
      setSite(dados.site);
      setOpcoes(dados.opcoes || {});
      setRelacionamentos(dados.relacionamentos || {});
      setAtivoSelecionado((atual) => {
        if (!atual) return null;
        return dados.site.ativos.find((item) => item.id === atual.id) || null;
      });
    } catch (erro) {
      setAviso({ tipo: "erro", texto: erro.message });
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarSite();
  }, [siteId]);

  const equipamentosDisponiveis = useMemo(() => {
    const lista = [...(relacionamentos.equipamentos || [])];
    if (ativoSelecionado?.equipamento && !lista.some((item) => item.id === ativoSelecionado.equipamento.id)) {
      lista.push(ativoSelecionado.equipamento);
    }
    return lista;
  }, [relacionamentos.equipamentos, ativoSelecionado]);

  const switchesDisponiveis = useMemo(() => {
    const lista = [...(relacionamentos.switches || [])];
    if (ativoSelecionado?.switch_rede && !lista.some((item) => item.id === ativoSelecionado.switch_rede.id)) {
      lista.push(ativoSelecionado.switch_rede);
    }
    return lista;
  }, [relacionamentos.switches, ativoSelecionado]);

  function abrirNovoAtivo() {
    setFormularioAtivo({
      ...ativoInicial,
      lado,
      posicao_u: "1",
      patch_panel: { ...ativoInicial.patch_panel },
    });
    setEditandoAtivoId(null);
    setModalAtivoAberto(true);
    setAviso(null);
  }

  function abrirEdicaoAtivo(ativo) {
    setAtivoSelecionado(ativo);
    setFormularioAtivo({
      ...ativoInicial,
      ...ativo,
      posicao_u: String(ativo.posicao_u),
      altura_u: String(ativo.altura_u),
      equipamento_id: ativo.equipamento_id || "",
      switch_rede_id: ativo.switch_rede_id || "",
      patch_panel: ativo.patch_panel
        ? {
            quantidade_portas: String(ativo.patch_panel.quantidade_portas),
            categoria: ativo.patch_panel.categoria,
            tipo_conector: ativo.patch_panel.tipo_conector,
            identificacao: ativo.patch_panel.identificacao || "",
            observacoes: ativo.patch_panel.observacoes || "",
          }
        : { ...ativoInicial.patch_panel },
    });
    setEditandoAtivoId(ativo.id);
    setModalAtivoAberto(true);
    setAviso(null);
  }

  function fecharModalAtivo() {
    if (salvando) return;
    setModalAtivoAberto(false);
    setEditandoAtivoId(null);
    setFormularioAtivo(ativoInicial);
  }

  function alterarCampoAtivo(evento) {
    const { name, value } = evento.target;
    setFormularioAtivo((atual) => ({ ...atual, [name]: value }));
  }

  function alterarCampoPatch(evento) {
    const { name, value } = evento.target;
    setFormularioAtivo((atual) => ({
      ...atual,
      patch_panel: { ...atual.patch_panel, [name]: value },
    }));
  }

  async function salvarAtivo(evento) {
    evento.preventDefault();
    setSalvando(true);
    setAviso(null);
    try {
      const endpoint = editandoAtivoId
        ? `/sites/ativos/${editandoAtivoId}/`
        : `/sites/${site.id}/ativos/`;
      const metodo = editandoAtivoId ? "PUT" : "POST";
      const dados = await apiRequest(endpoint, {
        method: metodo,
        body: JSON.stringify(formularioAtivo),
      });
      setAviso({ tipo: "sucesso", texto: dados.mensagem });
      setModalAtivoAberto(false);
      setEditandoAtivoId(null);
      setFormularioAtivo(ativoInicial);
      await carregarSite();
      setAtivoSelecionado(dados.ativo || null);
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

  async function excluirAtivo(ativo) {
    if (!window.confirm(`Remover ${ativo.nome} do rack?`)) return;
    try {
      const dados = await apiRequest(`/sites/ativos/${ativo.id}/`, { method: "DELETE" });
      setAviso({ tipo: "sucesso", texto: dados.mensagem });
      setAtivoSelecionado(null);
      await carregarSite();
    } catch (erro) {
      setAviso({ tipo: "erro", texto: erro.message });
    }
  }

  function abrirPorta(porta) {
    setPortaSelecionada(porta);
    setFormularioPorta({
      ...portaInicial,
      ...porta,
      setor_id: porta.setor_id || "",
      computador_id: porta.computador_id || "",
      equipamento_id: porta.equipamento_id || "",
      switch_porta_id: porta.switch_porta_id || "",
    });
    setModalPortaAberto(true);
    setAviso(null);
  }

  function alterarCampoPorta(evento) {
    const { name, value } = evento.target;
    setFormularioPorta((atual) => {
      const novo = { ...atual, [name]: value };
      if (name === "computador_id" && value) novo.equipamento_id = "";
      if (name === "equipamento_id" && value) novo.computador_id = "";
      return novo;
    });
  }

  async function salvarPorta(evento) {
    evento.preventDefault();
    setSalvando(true);
    try {
      const dados = await apiRequest(`/sites/patch-portas/${portaSelecionada.id}/`, {
        method: "PUT",
        body: JSON.stringify(formularioPorta),
      });
      setAviso({ tipo: "sucesso", texto: dados.mensagem });
      setModalPortaAberto(false);
      setPortaSelecionada(null);
      await carregarSite();
    } catch (erro) {
      const detalhes = erro.dados?.erro;
      setAviso({
        tipo: "erro",
        texto: typeof detalhes === "object" ? Object.values(detalhes).flat().join(" ") : erro.message,
      });
    } finally {
      setSalvando(false);
    }
  }

  if (carregando && !site) {
    return (
      <div className="border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        Carregando site e rack...
      </div>
    );
  }

  if (!site) {
    return (
      <div className="border border-red-200 bg-red-50 p-5 text-red-700">
        Não foi possível carregar o site.
      </div>
    );
  }

  const ocupacaoAtual = lado === "frente" ? site.ocupacao.usados_frente : site.ocupacao.usados_traseira;
  const livresAtual = lado === "frente" ? site.ocupacao.livres_frente : site.ocupacao.livres_traseira;
  const percentualAtual = lado === "frente" ? site.ocupacao.percentual_frente : site.ocupacao.percentual_traseira;

  return (
    <div>
      <Aviso aviso={aviso} aoFechar={() => setAviso(null)} />

      <button
        type="button"
        onClick={aoVoltar}
        className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950"
      >
        <FiArrowLeft size={17} /> Voltar para Sites
      </button>

      <div className="border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <FiServer size={26} className="text-slate-700" />
              <h2 className="text-2xl font-black text-slate-950">{site.nome}</h2>
              <span className={`border px-2.5 py-1 text-xs font-bold ${badgeStatus(site.status)}`}>
                {site.status_display}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              {site.codigo || "Sem código"} · {site.altura_u}U · Rack {site.largura_polegadas}”
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {[site.localizacao, site.setor?.nome].filter(Boolean).join(" · ") || "Localização não informada"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={carregarSite}
              className="flex items-center gap-2 border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
            >
              <FiRefreshCw size={16} /> Atualizar
            </button>
            {podeEditar && (
              <button
                type="button"
                onClick={abrirNovoAtivo}
                className="flex items-center gap-2 bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
              >
                <FiPlus size={16} /> Adicionar ativo
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Info titulo="Ativos instalados" valor={String(site.total_ativos)} icone={FiServer} />
        <Info titulo={`Ocupação — ${lado}`} valor={`${ocupacaoAtual}U de ${site.altura_u}U`} icone={FiLayers} />
        <Info titulo="Espaço livre" valor={`${livresAtual}U`} icone={FiBox} />
        <Info titulo="Ocupação" valor={`${percentualAtual}%`} icone={FiGrid} />
        <Info titulo="Responsável" valor={site.responsavel} icone={FiInfo} />
      </div>

      <div className="mt-4 border border-slate-200 bg-white p-2">
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setLado("frente")}
            className={`px-4 py-2.5 text-sm font-bold ${lado === "frente" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            Frente do rack
          </button>
          <button
            type="button"
            onClick={() => setLado("traseira")}
            className={`px-4 py-2.5 text-sm font-bold ${lado === "traseira" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            Traseira do rack
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="border border-slate-200 bg-[#e9eaed] p-3 sm:p-5">
          <RackVisual
            site={site}
            lado={lado}
            ativoSelecionadoId={ativoSelecionado?.id}
            aoSelecionar={setAtivoSelecionado}
          />
        </div>

        <aside className="space-y-4">
          {ativoSelecionado ? (
            <>
              <div className="border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Ativo selecionado</p>
                    <h3 className="mt-1 truncate text-lg font-black text-slate-950">{ativoSelecionado.nome}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {ativoSelecionado.tipo_display} · U{ativoSelecionado.posicao_u}
                      {ativoSelecionado.altura_u > 1 ? ` até U${ativoSelecionado.posicao_u_final}` : ""}
                    </p>
                  </div>
                  <button type="button" onClick={() => setAtivoSelecionado(null)} className="text-slate-400 hover:text-slate-950">
                    <FiX size={20} />
                  </button>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
                  <Info titulo="Marca / modelo" valor={[ativoSelecionado.marca, ativoSelecionado.modelo].filter(Boolean).join(" ")} />
                  <Info titulo="IP de gerenciamento" valor={ativoSelecionado.ip_gerenciamento} />
                  <Info titulo="Patrimônio" valor={ativoSelecionado.patrimonio} />
                  <Info titulo="Número de série" valor={ativoSelecionado.numero_serie} />
                  <Info titulo="Status" valor={ativoSelecionado.status_display} />
                  <Info titulo="Lado" valor={ativoSelecionado.lado_display} />
                </div>

                {ativoSelecionado.switch_rede && (
                  <div className="mt-4 border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
                    <p className="font-bold">Switch vinculado: {ativoSelecionado.switch_rede.nome}</p>
                    <p className="mt-1">
                      {ativoSelecionado.switch_rede.quantidade_portas} portas · {ativoSelecionado.switch_rede.ip_gerenciamento || "Sem IP"}
                    </p>
                    {aoAbrirSwitch && (
                      <button
                        type="button"
                        onClick={() => aoAbrirSwitch(ativoSelecionado.switch_rede.id)}
                        className="mt-3 border border-sky-300 px-3 py-2 text-xs font-bold hover:bg-sky-100"
                      >
                        Abrir mapa de portas do switch
                      </button>
                    )}
                  </div>
                )}

                {ativoSelecionado.observacoes && (
                  <div className="mt-4 border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    {ativoSelecionado.observacoes}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {podeEditar && (
                    <button
                      type="button"
                      onClick={() => abrirEdicaoAtivo(ativoSelecionado)}
                      className="flex items-center gap-2 border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
                    >
                      <FiEdit2 size={15} /> Editar
                    </button>
                  )}
                  {podeExcluir && (
                    <button
                      type="button"
                      onClick={() => excluirAtivo(ativoSelecionado)}
                      className="flex items-center gap-2 border border-red-200 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50"
                    >
                      <FiTrash2 size={15} /> Remover
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="border border-dashed border-slate-300 bg-white p-8 text-center">
              <FiTool size={28} className="mx-auto text-slate-300" />
              <p className="mt-3 font-bold text-slate-700">Selecione um ativo no rack</p>
              <p className="mt-1 text-sm text-slate-500">
                Clique em um equipamento da figura para ver as informações e as portas.
              </p>
            </div>
          )}
        </aside>
      </div>

      {ativoSelecionado?.tipo === "patch_panel" && (
        <div className="mt-4">
          <PatchPanelPortas
            patchPanel={ativoSelecionado.patch_panel}
            aoSelecionarPorta={abrirPorta}
          />
        </div>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="border border-slate-200 bg-white p-5">
          <h3 className="font-black text-slate-950">Lista de ativos</h3>
          <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
            {site.ativos.length === 0 ? (
              <p className="py-5 text-sm text-slate-500">Nenhum ativo instalado neste rack.</p>
            ) : (
              [...site.ativos]
                .sort((a, b) => b.posicao_u - a.posicao_u)
                .map((ativo) => {
                  const config = tipoConfig(ativo.tipo);
                  const Icone = config.icone;
                  return (
                    <button
                      key={ativo.id}
                      type="button"
                      onClick={() => {
                        setLado(ativo.lado);
                        setAtivoSelecionado(ativo);
                      }}
                      className="flex w-full items-center gap-3 py-3 text-left hover:bg-slate-50"
                    >
                      <Icone size={18} className="shrink-0 text-slate-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-800">{ativo.nome}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {ativo.tipo_display} · {ativo.lado_display} · U{ativo.posicao_u}
                          {ativo.altura_u > 1 ? `–${ativo.posicao_u_final}` : ""}
                        </p>
                      </div>
                      <span className={`border px-2 py-1 text-[10px] font-bold ${badgeStatus(ativo.status)}`}>
                        {ativo.status_display}
                      </span>
                    </button>
                  );
                })
            )}
          </div>
        </div>

        <div className="border border-slate-200 bg-white p-5">
          <h3 className="font-black text-slate-950">Informações do site</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Info titulo="Código" valor={site.codigo} />
            <Info titulo="Setor" valor={site.setor?.nome} />
            <Info titulo="Localização" valor={site.localizacao} />
            <Info titulo="Responsável" valor={site.responsavel} />
            <Info titulo="Criado em" valor={site.criado_em} />
            <Info titulo="Atualizado em" valor={site.atualizado_em} />
          </div>
          {site.observacoes && (
            <div className="mt-3 border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              {site.observacoes}
            </div>
          )}
        </div>
      </div>

      {modalAtivoAberto && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50">
          <button type="button" aria-label="Fechar" className="absolute inset-0" onClick={fecharModalAtivo} />
          <form onSubmit={salvarAtivo} className="relative flex h-full w-full max-w-3xl flex-col bg-[#f4f5f7] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  {editandoAtivoId ? "Editar ativo do rack" : "Adicionar ativo ao rack"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">Posicione o equipamento exatamente como ele está instalado.</p>
              </div>
              <button type="button" onClick={fecharModalAtivo} className="p-2 text-slate-500 hover:text-slate-950"><FiX size={21} /></button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
              <section className="border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-4 py-4">
                  <h3 className="font-black text-slate-950">Identificação e posição</h3>
                </div>
                <div className="grid gap-4 p-4 sm:grid-cols-2">
                  <Campo label="Nome do ativo" obrigatorio>
                    <input name="nome" value={formularioAtivo.nome} onChange={alterarCampoAtivo} className={inputClasse} placeholder="Ex.: Switch Core 01" />
                  </Campo>
                  <Campo label="Tipo" obrigatorio>
                    <select name="tipo" value={formularioAtivo.tipo} onChange={alterarCampoAtivo} className={inputClasse}>
                      {opcoes.tipos_ativos?.map((opcao) => <option key={opcao.value} value={opcao.value}>{opcao.label}</option>)}
                    </select>
                  </Campo>
                  {formularioAtivo.tipo === "outro" && (
                    <Campo label="Qual é o tipo?" obrigatorio>
                      <input name="tipo_outro_descricao" value={formularioAtivo.tipo_outro_descricao} onChange={alterarCampoAtivo} className={inputClasse} />
                    </Campo>
                  )}
                  <Campo label="Lado do rack">
                    <select name="lado" value={formularioAtivo.lado} onChange={alterarCampoAtivo} className={inputClasse}>
                      {opcoes.lados?.map((opcao) => <option key={opcao.value} value={opcao.value}>{opcao.label}</option>)}
                    </select>
                  </Campo>
                  <Campo label="Posição inicial">
                    <select name="posicao_u" value={formularioAtivo.posicao_u} onChange={alterarCampoAtivo} className={inputClasse}>
                      {Array.from({ length: site.altura_u }, (_, indice) => indice + 1).map((numero) => <option key={numero} value={numero}>U{numero}</option>)}
                    </select>
                  </Campo>
                  <Campo label="Altura ocupada">
                    <select name="altura_u" value={formularioAtivo.altura_u} onChange={alterarCampoAtivo} className={inputClasse}>
                      {Array.from({ length: Math.min(20, site.altura_u) }, (_, indice) => indice + 1).map((numero) => <option key={numero} value={numero}>{numero}U</option>)}
                    </select>
                  </Campo>
                  <Campo label="Status">
                    <select name="status" value={formularioAtivo.status} onChange={alterarCampoAtivo} className={inputClasse}>
                      {opcoes.status_ativos?.map((opcao) => <option key={opcao.value} value={opcao.value}>{opcao.label}</option>)}
                    </select>
                  </Campo>
                </div>
              </section>

              <section className="border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-4 py-4"><h3 className="font-black text-slate-950">Dados técnicos</h3></div>
                <div className="grid gap-4 p-4 sm:grid-cols-2">
                  <Campo label="Marca"><input name="marca" value={formularioAtivo.marca} onChange={alterarCampoAtivo} className={inputClasse} /></Campo>
                  <Campo label="Modelo"><input name="modelo" value={formularioAtivo.modelo} onChange={alterarCampoAtivo} className={inputClasse} /></Campo>
                  <Campo label="Patrimônio"><input name="patrimonio" value={formularioAtivo.patrimonio} onChange={alterarCampoAtivo} className={inputClasse} /></Campo>
                  <Campo label="Número de série"><input name="numero_serie" value={formularioAtivo.numero_serie} onChange={alterarCampoAtivo} className={inputClasse} /></Campo>
                  <Campo label="IP de gerenciamento"><input name="ip_gerenciamento" value={formularioAtivo.ip_gerenciamento} onChange={alterarCampoAtivo} className={inputClasse} placeholder="192.168.1.10" /></Campo>
                  <Campo label="MAC"><input name="mac_address" value={formularioAtivo.mac_address} onChange={alterarCampoAtivo} className={inputClasse} placeholder="AA:BB:CC:DD:EE:FF" /></Campo>
                  <Campo label="Equipamento do inventário">
                    <select name="equipamento_id" value={formularioAtivo.equipamento_id} onChange={alterarCampoAtivo} className={inputClasse}>
                      <option value="">Sem equipamento relacionado</option>
                      {equipamentosDisponiveis.map((item) => <option key={item.id} value={item.id}>{item.tipo_display} · {[item.marca, item.modelo, item.patrimonio].filter(Boolean).join(" ") || `ID ${item.id}`}</option>)}
                    </select>
                  </Campo>
                  {formularioAtivo.tipo === "switch" && (
                    <Campo label="Switch existente">
                      <select name="switch_rede_id" value={formularioAtivo.switch_rede_id} onChange={alterarCampoAtivo} className={inputClasse}>
                        <option value="">Cadastrar apenas como ativo genérico</option>
                        {switchesDisponiveis.map((item) => <option key={item.id} value={item.id}>{item.nome} · {item.quantidade_portas} portas · {item.ip_gerenciamento || "Sem IP"}</option>)}
                      </select>
                    </Campo>
                  )}
                  <div className="sm:col-span-2"><Campo label="Observações"><textarea name="observacoes" value={formularioAtivo.observacoes} onChange={alterarCampoAtivo} className={`${inputClasse} min-h-24`} /></Campo></div>
                </div>
              </section>

              {formularioAtivo.tipo === "patch_panel" && (
                <section className="border border-emerald-200 bg-white">
                  <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-4">
                    <h3 className="font-black text-emerald-950">Configuração do patch panel</h3>
                    <p className="mt-1 text-sm text-emerald-700">As portas serão geradas automaticamente.</p>
                  </div>
                  <div className="grid gap-4 p-4 sm:grid-cols-2">
                    <Campo label="Quantidade de portas">
                      <select name="quantidade_portas" value={formularioAtivo.patch_panel.quantidade_portas} onChange={alterarCampoPatch} className={inputClasse}>
                        {[12, 16, 24, 32, 48, 72, 96].map((numero) => <option key={numero} value={numero}>{numero} portas</option>)}
                      </select>
                    </Campo>
                    <Campo label="Categoria">
                      <select name="categoria" value={formularioAtivo.patch_panel.categoria} onChange={alterarCampoPatch} className={inputClasse}>
                        {opcoes.categorias_patch?.map((opcao) => <option key={opcao.value} value={opcao.value}>{opcao.label}</option>)}
                      </select>
                    </Campo>
                    <Campo label="Tipo de conector">
                      <select name="tipo_conector" value={formularioAtivo.patch_panel.tipo_conector} onChange={alterarCampoPatch} className={inputClasse}>
                        {opcoes.conectores_patch?.map((opcao) => <option key={opcao.value} value={opcao.value}>{opcao.label}</option>)}
                      </select>
                    </Campo>
                    <Campo label="Identificação"><input name="identificacao" value={formularioAtivo.patch_panel.identificacao} onChange={alterarCampoPatch} className={inputClasse} placeholder="Ex.: PP-ADM-01" /></Campo>
                    <div className="sm:col-span-2"><Campo label="Observações do patch panel"><textarea name="observacoes" value={formularioAtivo.patch_panel.observacoes} onChange={alterarCampoPatch} className={`${inputClasse} min-h-20`} /></Campo></div>
                  </div>
                </section>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <button type="button" onClick={fecharModalAtivo} className="border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100">Cancelar</button>
              <button type="submit" disabled={salvando} className="bg-slate-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60">{salvando ? "Salvando..." : "Salvar ativo"}</button>
            </div>
          </form>
        </div>
      )}

      {modalPortaAberto && portaSelecionada && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/50">
          <button type="button" aria-label="Fechar" className="absolute inset-0" onClick={() => setModalPortaAberto(false)} />
          <form onSubmit={salvarPorta} className="relative flex h-full w-full max-w-xl flex-col bg-[#f4f5f7] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-black text-slate-950">Porta {portaSelecionada.numero}</h2>
                <p className="mt-1 text-sm text-slate-500">Mapeamento físico e lógico do patch panel.</p>
              </div>
              <button type="button" onClick={() => setModalPortaAberto(false)} className="p-2 text-slate-500 hover:text-slate-950"><FiX size={21} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              <div className="grid gap-4 border border-slate-200 bg-white p-4 sm:grid-cols-2">
                <Campo label="Status">
                  <select name="status" value={formularioPorta.status} onChange={alterarCampoPorta} className={inputClasse}>
                    {opcoes.status_portas_patch?.map((opcao) => <option key={opcao.value} value={opcao.value}>{opcao.label}</option>)}
                  </select>
                </Campo>
                <Campo label="Identificação"><input name="identificacao" value={formularioPorta.identificacao} onChange={alterarCampoPorta} className={inputClasse} placeholder="Ex.: Financeiro 01" /></Campo>
                <Campo label="Ponto lógico / tomada"><input name="ponto_logico" value={formularioPorta.ponto_logico} onChange={alterarCampoPorta} className={inputClasse} placeholder="Ex.: PT-ADM-023" /></Campo>
                <Campo label="Local de destino"><input name="local_destino" value={formularioPorta.local_destino} onChange={alterarCampoPorta} className={inputClasse} placeholder="Ex.: Sala Financeiro, mesa 02" /></Campo>
                <Campo label="Setor atendido">
                  <select name="setor_id" value={formularioPorta.setor_id} onChange={alterarCampoPorta} className={inputClasse}>
                    <option value="">Sem setor</option>
                    {relacionamentos.setores?.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                  </select>
                </Campo>
                <Campo label="Porta do switch">
                  <select name="switch_porta_id" value={formularioPorta.switch_porta_id} onChange={alterarCampoPorta} className={inputClasse}>
                    <option value="">Sem vínculo com switch</option>
                    {relacionamentos.switch_portas?.map((item) => <option key={item.id} value={item.id}>{item.switch_nome} · Porta {item.numero}{item.nome ? ` · ${item.nome}` : ""}</option>)}
                  </select>
                </Campo>
                <Campo label="Computador relacionado">
                  <select name="computador_id" value={formularioPorta.computador_id} onChange={alterarCampoPorta} className={inputClasse}>
                    <option value="">Sem computador</option>
                    {relacionamentos.computadores?.map((item) => <option key={item.id} value={item.id}>{item.nome_usuario} · {item.ip_computador}</option>)}
                  </select>
                </Campo>
                <Campo label="Outro equipamento">
                  <select name="equipamento_id" value={formularioPorta.equipamento_id} onChange={alterarCampoPorta} className={inputClasse}>
                    <option value="">Sem equipamento</option>
                    {(relacionamentos.equipamentos_portas || []).map((item) => <option key={item.id} value={item.id}>{item.tipo_display} · {[item.marca, item.modelo, item.patrimonio].filter(Boolean).join(" ") || `ID ${item.id}`}</option>)}
                  </select>
                </Campo>
                <div className="sm:col-span-2"><Campo label="Observações"><textarea name="observacoes" value={formularioPorta.observacoes} onChange={alterarCampoPorta} className={`${inputClasse} min-h-24`} /></Campo></div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <button type="button" onClick={() => setModalPortaAberto(false)} className="border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100">Cancelar</button>
              <button type="submit" disabled={salvando} className="bg-slate-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60">{salvando ? "Salvando..." : "Salvar porta"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
