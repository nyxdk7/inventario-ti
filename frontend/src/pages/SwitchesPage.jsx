import { useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiEdit2,
  FiEye,
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
  equipamento_id: "",
  marca: "",
  modelo: "",
  patrimonio: "",
  numero_serie: "",
  setor_id: "",
  localizacao: "",
  rack: "",
  ip_gerenciamento: "",
  quantidade_portas: 24,
  quantidade_portas_sfp: 0,
  status: "em_uso",
  observacoes: "",
};

const inputClasse =
  "w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5";

function Aviso({ aviso, aoFechar }) {
  if (!aviso) return null;

  const classes =
    aviso.tipo === "erro"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <div className={`flex items-start justify-between gap-3 border px-4 py-3 text-sm ${classes}`}>
      <span>{aviso.texto}</span>
      <button type="button" onClick={aoFechar} className="shrink-0">
        <FiX size={17} />
      </button>
    </div>
  );
}

function badgeStatus(status) {
  if (status === "em_uso") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "reserva") return "border-blue-200 bg-blue-50 text-blue-700";
  if (status === "manutencao") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-100 text-slate-600";
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

function Campo({ label, obrigatorio = false, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-slate-700">
        {label}
        {obrigatorio && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function SwitchCard({ item, aoVer, aoEditar, aoExcluir, podeEditar, podeExcluir }) {
  const resumo = item.resumo_portas || {};

  return (
    <article className="border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm sm:p-5">
      <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <FiServer size={20} className="text-slate-400" />
            <h3 className="text-lg font-black text-slate-950">{item.nome}</h3>
            <span className={`inline-flex border px-2 py-1 text-xs font-bold ${badgeStatus(item.status)}`}>
              {item.status_display}
            </span>
          </div>

          <p className="mt-2 text-sm font-semibold text-slate-600">
            {[item.marca, item.modelo].filter(Boolean).join(" ") || "Marca e modelo não informados"}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Gerenciamento</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{item.ip_gerenciamento || "-"}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Setor</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{item.setor?.nome || "-"}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Local / rack</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {[item.localizacao, item.rack].filter(Boolean).join(" · ") || "-"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Portas</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {resumo.total || item.quantidade_portas} total · {resumo.ativas || 0} em uso
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Disponibilidade</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {resumo.livres || 0} livres · {resumo.atencao || 0} atenção
              </p>
            </div>
          </div>

          {item.observacoes && (
            <p className="mt-4 line-clamp-2 border-l-2 border-slate-200 pl-3 text-sm leading-6 text-slate-500">
              {item.observacoes}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 xl:min-w-40">
          <button
            type="button"
            onClick={() => aoVer(item.id)}
            className="flex items-center justify-center gap-2 border border-slate-950 bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
          >
            <FiEye size={16} />
            Ver portas
          </button>

          {podeEditar && (
            <button
              type="button"
              onClick={() => aoEditar(item)}
              className="flex items-center justify-center gap-2 border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
            >
              <FiEdit2 size={16} />
              Editar
            </button>
          )}

          {podeExcluir && (
            <button
              type="button"
              onClick={() => aoExcluir(item)}
              className="flex items-center justify-center gap-2 border border-red-200 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50"
            >
              <FiTrash2 size={16} />
              Excluir
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function SwitchesPage({ permissoes, aoVerDetalhes }) {
  const [switches, setSwitches] = useState([]);
  const [opcoes, setOpcoes] = useState({ setores: [], equipamentos_switch: [], status_switch: [] });
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [painelAberto, setPainelAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formulario, setFormulario] = useState(formularioInicial);

  const podeEditar = permissoes?.podeEditarInventario ?? true;
  const podeExcluir = permissoes?.podeExcluir ?? true;

  const resumo = useMemo(() => {
    return {
      total: switches.length,
      emUso: switches.filter((item) => item.status === "em_uso").length,
      portas: switches.reduce((total, item) => total + Number(item.quantidade_portas || 0), 0),
      livres: switches.reduce((total, item) => total + Number(item.resumo_portas?.livres || 0), 0),
    };
  }, [switches]);

  async function carregarSwitches(termo = busca) {
    setCarregando(true);
    try {
      const query = termo.trim() ? `?q=${encodeURIComponent(termo.trim())}` : "";
      const dados = await apiRequest(`/switches/${query}`);
      setSwitches(dados.resultados || []);
      setOpcoes(dados.opcoes || {});
    } catch (erro) {
      setAviso({ tipo: "erro", texto: erro.message });
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarSwitches("");
  }, []);

  useEffect(() => {
    const temporizador = window.setTimeout(() => carregarSwitches(busca), 350);
    return () => window.clearTimeout(temporizador);
  }, [busca]);

  function alterarCampo(evento) {
    const { name, value } = evento.target;
    setFormulario((atual) => ({ ...atual, [name]: value }));
  }

  function abrirNovo() {
    setFormulario(formularioInicial);
    setEditandoId(null);
    setAviso(null);
    setPainelAberto(true);
  }

  function abrirEdicao(item) {
    setFormulario({
      nome: item.nome || "",
      equipamento_id: item.equipamento_id || "",
      marca: item.marca || "",
      modelo: item.modelo || "",
      patrimonio: item.patrimonio || "",
      numero_serie: item.numero_serie || "",
      setor_id: item.setor_id || "",
      localizacao: item.localizacao || "",
      rack: item.rack || "",
      ip_gerenciamento: item.ip_gerenciamento || "",
      quantidade_portas: item.quantidade_portas || 24,
      quantidade_portas_sfp: item.quantidade_portas_sfp || 0,
      status: item.status || "em_uso",
      observacoes: item.observacoes || "",
    });
    setEditandoId(item.id);
    setAviso(null);
    setPainelAberto(true);
  }

  function fecharPainel() {
    if (salvando) return;
    setPainelAberto(false);
    setEditandoId(null);
    setFormulario(formularioInicial);
  }

  async function salvar(evento) {
    evento.preventDefault();
    setSalvando(true);
    setAviso(null);

    try {
      const endpoint = editandoId ? `/switches/${editandoId}/` : "/switches/";
      const method = editandoId ? "PUT" : "POST";
      const dados = await apiRequest(endpoint, {
        method,
        body: JSON.stringify({
          ...formulario,
          quantidade_portas: Number(formulario.quantidade_portas),
          quantidade_portas_sfp: Number(formulario.quantidade_portas_sfp),
        }),
      });

      setAviso({ tipo: "sucesso", texto: dados.mensagem });
      setPainelAberto(false);
      setEditandoId(null);
      setFormulario(formularioInicial);
      await carregarSwitches();
    } catch (erro) {
      const texto = typeof erro.dados?.erro === "object" ? JSON.stringify(erro.dados.erro) : erro.message;
      setAviso({ tipo: "erro", texto });
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(item) {
    const confirmou = window.confirm(
      `Excluir o switch “${item.nome}” e todas as ${item.quantidade_portas} portas? Essa ação não pode ser desfeita.`
    );
    if (!confirmou) return;

    try {
      const dados = await apiRequest(`/switches/${item.id}/`, { method: "DELETE" });
      setAviso({ tipo: "sucesso", texto: dados.mensagem });
      await carregarSwitches();
    } catch (erro) {
      setAviso({ tipo: "erro", texto: erro.message });
    }
  }

  return (
    <div className="space-y-5">
      <Aviso aviso={aviso} aoFechar={() => setAviso(null)} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-950">Controle de switches</h2>
          <p className="mt-1 text-sm text-slate-500">
            Cadastre os switches e acompanhe a ocupação de cada porta.
          </p>
        </div>

        {podeEditar && (
          <button
            type="button"
            onClick={abrirNovo}
            className="flex items-center justify-center gap-2 border border-slate-950 bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 sm:py-2.5"
          >
            <FiPlus size={17} />
            Novo switch
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ResumoCard titulo="Switches" valor={resumo.total} descricao="Equipamentos cadastrados" Icone={FiServer} />
        <ResumoCard titulo="Em uso" valor={resumo.emUso} descricao="Ativos na infraestrutura" Icone={FiActivity} />
        <ResumoCard titulo="Portas" valor={resumo.portas} descricao="Total disponível" Icone={FiMapPin} />
        <ResumoCard titulo="Livres" valor={resumo.livres} descricao="Sem dispositivo vinculado" Icone={FiPlus} />
      </div>

      <div className="border border-slate-200 bg-white p-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Buscar por nome, modelo, IP, setor, local ou rack"
            className="w-full border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-slate-950"
          />
        </div>
      </div>

      <div className="space-y-3">
        {carregando ? (
          <div className="border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Carregando switches...
          </div>
        ) : switches.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-white p-10 text-center">
            <FiServer size={32} className="mx-auto text-slate-300" />
            <p className="mt-3 font-bold text-slate-800">Nenhum switch encontrado</p>
            <p className="mt-1 text-sm text-slate-500">Cadastre o primeiro switch para gerar o mapa das portas.</p>
          </div>
        ) : (
          switches.map((item) => (
            <SwitchCard
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

      {painelAberto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/45" onClick={fecharPainel} />
          <div className="relative flex h-full w-full max-w-2xl flex-col bg-[#f4f5f7] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <h3 className="text-lg font-black text-slate-950">
                  {editandoId ? "Editar switch" : "Novo switch"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  As portas serão geradas automaticamente conforme a quantidade informada.
                </p>
              </div>
              <button type="button" onClick={fecharPainel} className="text-slate-500 hover:text-slate-950">
                <FiX size={22} />
              </button>
            </div>

            <form onSubmit={salvar} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
                <section className="border border-slate-200 bg-white p-4">
                  <h4 className="mb-4 text-sm font-black text-slate-950">Identificação</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Campo label="Nome do switch" obrigatorio>
                      <input name="nome" value={formulario.nome} onChange={alterarCampo} className={inputClasse} required />
                    </Campo>
                    <Campo label="Equipamento já cadastrado">
                      <select name="equipamento_id" value={formulario.equipamento_id} onChange={alterarCampo} className={inputClasse}>
                        <option value="">Não vincular agora</option>
                        {(opcoes.equipamentos_switch || []).map((item) => (
                          <option key={item.id} value={item.id}>
                            {[item.marca, item.modelo, item.patrimonio].filter(Boolean).join(" · ") || `Switch #${item.id}`}
                          </option>
                        ))}
                      </select>
                    </Campo>
                    <Campo label="Marca">
                      <input name="marca" value={formulario.marca} onChange={alterarCampo} className={inputClasse} />
                    </Campo>
                    <Campo label="Modelo">
                      <input name="modelo" value={formulario.modelo} onChange={alterarCampo} className={inputClasse} />
                    </Campo>
                    <Campo label="Patrimônio">
                      <input name="patrimonio" value={formulario.patrimonio} onChange={alterarCampo} className={inputClasse} />
                    </Campo>
                    <Campo label="Número de série">
                      <input name="numero_serie" value={formulario.numero_serie} onChange={alterarCampo} className={inputClasse} />
                    </Campo>
                  </div>
                </section>

                <section className="border border-slate-200 bg-white p-4">
                  <h4 className="mb-4 text-sm font-black text-slate-950">Local e gerenciamento</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Campo label="Setor">
                      <select name="setor_id" value={formulario.setor_id} onChange={alterarCampo} className={inputClasse}>
                        <option value="">Sem setor</option>
                        {(opcoes.setores || []).map((setor) => (
                          <option key={setor.id} value={setor.id}>{setor.nome}</option>
                        ))}
                      </select>
                    </Campo>
                    <Campo label="IP de gerenciamento">
                      <input name="ip_gerenciamento" value={formulario.ip_gerenciamento} onChange={alterarCampo} className={inputClasse} placeholder="192.168.1.10" />
                    </Campo>
                    <Campo label="Localização">
                      <input name="localizacao" value={formulario.localizacao} onChange={alterarCampo} className={inputClasse} placeholder="Sala do T.I." />
                    </Campo>
                    <Campo label="Rack / armário">
                      <input name="rack" value={formulario.rack} onChange={alterarCampo} className={inputClasse} placeholder="Rack principal U12" />
                    </Campo>
                  </div>
                </section>

                <section className="border border-slate-200 bg-white p-4">
                  <h4 className="mb-4 text-sm font-black text-slate-950">Portas e situação</h4>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Campo label="Total de portas" obrigatorio>
                      <input type="number" min="2" max="128" name="quantidade_portas" value={formulario.quantidade_portas} onChange={alterarCampo} className={inputClasse} required />
                    </Campo>
                    <Campo label="Portas SFP/SFP+">
                      <input type="number" min="0" max="32" name="quantidade_portas_sfp" value={formulario.quantidade_portas_sfp} onChange={alterarCampo} className={inputClasse} />
                    </Campo>
                    <Campo label="Status">
                      <select name="status" value={formulario.status} onChange={alterarCampo} className={inputClasse}>
                        {(opcoes.status_switch || []).map((item) => (
                          <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                      </select>
                    </Campo>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[8, 16, 24, 48, 52].map((quantidade) => (
                      <button
                        key={quantidade}
                        type="button"
                        onClick={() => setFormulario((atual) => ({ ...atual, quantidade_portas: quantidade }))}
                        className="border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
                      >
                        {quantidade} portas
                      </button>
                    ))}
                  </div>
                </section>

                <section className="border border-slate-200 bg-white p-4">
                  <Campo label="Observações">
                    <textarea name="observacoes" value={formulario.observacoes} onChange={alterarCampo} rows="4" className={inputClasse} />
                  </Campo>
                </section>
              </div>

              <div className="flex shrink-0 gap-3 border-t border-slate-200 bg-white p-4">
                <button type="button" onClick={fecharPainel} className="flex-1 border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100">
                  Cancelar
                </button>
                <button type="submit" disabled={salvando} className="flex-1 border border-slate-950 bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60">
                  {salvando ? "Salvando..." : editandoId ? "Salvar alterações" : "Cadastrar switch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
