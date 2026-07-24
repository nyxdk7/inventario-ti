import { useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiCalendar,
  FiEdit2,
  FiPlus,
  FiSearch,
  FiTool,
  FiTrash2,
  FiUser,
  FiX,
} from "react-icons/fi";

import { apiRequest } from "../services/api";

function dataHoraAtualInput() {
  const agora = new Date();
  agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
  return agora.toISOString().slice(0, 16);
}

function somenteDigitos(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function moedaParaDecimal(valor) {
  const digitos = somenteDigitos(valor);
  if (!digitos) {
    return "";
  }
  return (Number(digitos) / 100).toFixed(2);
}

function formatarMoeda(valor) {
  const texto = String(valor ?? "").trim();
  if (!texto) {
    return "";
  }

  const digitos = somenteDigitos(texto);
  if (!digitos) {
    return "";
  }

  const numero = Number(digitos) / 100;
  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const formularioInicial = {
  equipamento_id: "",
  tipo_ocorrencia: "manutencao",
  data_ocorrencia: dataHoraAtualInput(),
  responsavel_atendimento: "",
  descricao: "",
  custo: "",
  status: "aberto",
};

const tiposPadrao = [
  { value: "manutencao", label: "Manutenção" },
  { value: "troca_peca", label: "Troca de peça" },
  { value: "formatacao", label: "Formatação" },
  { value: "limpeza", label: "Limpeza" },
  { value: "instalacao_software", label: "Instalação de software" },
  { value: "baixa", label: "Baixa" },
  { value: "movimentacao", label: "Movimentação de setor" },
  { value: "observacao", label: "Observação geral" },
];

const statusPadrao = [
  { value: "aberto", label: "Aberto" },
  { value: "andamento", label: "Em andamento" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
];

const inputClasse = "w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5";

function Aviso({ aviso, onFechar }) {
  if (!aviso) {
    return null;
  }

  const estilos = {
    sucesso: "border-emerald-200 bg-emerald-50 text-emerald-900",
    erro: "border-red-200 bg-red-50 text-red-900",
  };

  return (
    <div className={`mb-5 border p-4 ${estilos[aviso.tipo] || estilos.erro}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">{aviso.titulo}</p>
          {aviso.texto && <p className="mt-1 text-sm">{aviso.texto}</p>}
        </div>

        <button type="button" onClick={onFechar} className="text-sm font-bold opacity-70 hover:opacity-100">
          X
        </button>
      </div>
    </div>
  );
}

function nomeEquipamento(equipamento) {
  if (!equipamento) {
    return "-";
  }

  const identificador = equipamento.patrimonio || equipamento.numero_serie || `ID ${equipamento.id}`;
  const modelo = [equipamento.marca, equipamento.modelo].filter(Boolean).join(" ");

  return `${equipamento.tipo_display} - ${identificador}${modelo ? ` - ${modelo}` : ""}`;
}

function badgeStatus(status) {
  if (status === "aberto") {
    return "border-red-200 bg-red-50 text-red-800";
  }
  if (status === "andamento") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  if (status === "concluido") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function ResumoCard({ titulo, valor, descricao, icone: Icone }) {
  return (
    <div className="border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{titulo}</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{valor}</p>
          {descricao && <p className="mt-1 text-sm text-slate-500">{descricao}</p>}
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center text-slate-500">
          <Icone size={22} />
        </div>
      </div>
    </div>
  );
}

function InfoCompacta({ titulo, valor }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{titulo}</p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-800">{valor || "-"}</p>
    </div>
  );
}

function ManutencaoCard({ manutencao, aoEditar, aoExcluir, podeEditar, podeExcluir }) {
  return (
    <article className="border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[56px_1fr_auto] lg:items-start">
        <div className="flex h-14 w-14 items-center justify-center border border-slate-200 text-slate-500">
          <FiTool size={25} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-base font-black text-slate-950 sm:text-lg">
              {manutencao.tipo_ocorrencia_display}
            </h3>
            <span className={`inline-flex border px-2 py-1 text-xs font-bold ${badgeStatus(manutencao.status)}`}>
              {manutencao.status_display}
            </span>
          </div>

          <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-600">
            {nomeEquipamento(manutencao.equipamento)}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <InfoCompacta titulo="Data" valor={manutencao.data_ocorrencia} />
            <InfoCompacta titulo="Responsável" valor={manutencao.responsavel_atendimento} />
            <InfoCompacta titulo="Setor" valor={manutencao.equipamento?.setor?.nome || "Sem setor"} />
            <InfoCompacta titulo="Custo" valor={manutencao.custo ? formatarMoeda(manutencao.custo) : "-"} />
            <InfoCompacta titulo="Atualizado" valor={manutencao.atualizado_em} />
          </div>

          <p className="mt-4 line-clamp-2 border-l-2 border-slate-200 pl-3 text-sm leading-6 text-slate-500">
            {manutencao.descricao || "-"}
          </p>
        </div>

        {(podeEditar || podeExcluir) && (
          <div className="flex flex-col gap-2 lg:min-w-32">
            {podeEditar && (
              <button
                type="button"
                onClick={() => aoEditar(manutencao)}
                className="flex items-center justify-center gap-2 border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 lg:py-2.5"
              >
                <FiEdit2 size={16} />
                Editar
              </button>
            )}

            {podeExcluir && (
              <button
                type="button"
                onClick={() => aoExcluir(manutencao)}
                className="flex items-center justify-center gap-2 border border-red-200 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-50 lg:py-2.5"
              >
                <FiTrash2 size={16} />
                Excluir
              </button>
            )}
          </div>
        )}
      </div>
    </article>
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

function SecaoFormulario({ titulo, descricao, children }) {
  return (
    <section className="border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-4">
        <h3 className="text-sm font-black text-slate-950">{titulo}</h3>
        {descricao && <p className="mt-1 text-sm leading-5 text-slate-500">{descricao}</p>}
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </section>
  );
}

export default function ManutencoesPage({ permissoes }) {
  const [manutencoes, setManutencoes] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [tipos, setTipos] = useState(tiposPadrao);
  const [statusOpcoes, setStatusOpcoes] = useState(statusPadrao);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [editandoId, setEditandoId] = useState(null);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);

  const podeEditar = permissoes?.podeEditarInventario ?? true;
  const podeExcluir = permissoes?.podeExcluir ?? true;

  const resumo = useMemo(() => {
    const total = manutencoes.length;
    const abertos = manutencoes.filter((item) => item.status === "aberto").length;
    const andamento = manutencoes.filter((item) => item.status === "andamento").length;
    const concluidos = manutencoes.filter((item) => item.status === "concluido").length;

    return { total, abertos, andamento, concluidos };
  }, [manutencoes]);

  async function carregarEquipamentos() {
    try {
      const dados = await apiRequest("/equipamentos/");
      setEquipamentos(dados.resultados || []);
    } catch (erro) {
      setAviso({ tipo: "erro", titulo: "Erro ao carregar equipamentos", texto: erro.message });
    }
  }

  async function carregarManutencoes(termoBusca = busca) {
    setCarregando(true);

    try {
      const query = termoBusca.trim()
        ? `?q=${encodeURIComponent(termoBusca.trim())}`
        : "";

      const dados = await apiRequest(`/manutencoes/${query}`);
      setManutencoes(dados.resultados || []);
      setTipos(dados.opcoes?.tipos || tiposPadrao);
      setStatusOpcoes(dados.opcoes?.status || statusPadrao);
    } catch (erro) {
      setAviso({ tipo: "erro", titulo: "Erro ao carregar históricos", texto: erro.message });
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarEquipamentos();
  }, []);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      carregarManutencoes(busca);
    }, 250);

    return () => clearTimeout(temporizador);
  }, [busca]);

  function atualizarCampo(evento) {
    const { name, value } = evento.target;
    setFormulario((estadoAtual) => ({ ...estadoAtual, [name]: value }));
  }

  function atualizarCampoMoeda(evento, campo) {
    const decimal = moedaParaDecimal(evento.target.value);
    setFormulario((estadoAtual) => ({ ...estadoAtual, [campo]: decimal }));
  }

  function limparFormulario() {
    setFormulario({
      ...formularioInicial,
      data_ocorrencia: dataHoraAtualInput(),
    });
    setEditandoId(null);
  }

  function abrirNovoRegistro() {
    limparFormulario();
    setAviso(null);
    setModalCadastroAberto(true);
  }

  function fecharModalCadastro() {
    if (salvando) {
      return;
    }
    limparFormulario();
    setModalCadastroAberto(false);
  }

  async function salvarManutencao(evento) {
    evento.preventDefault();

    setSalvando(true);
    setAviso(null);

    const editando = Boolean(editandoId);
    const endpoint = editando ? `/manutencoes/${editandoId}/` : "/manutencoes/";
    const metodo = editando ? "PUT" : "POST";

    try {
      const dados = await apiRequest(endpoint, {
        method: metodo,
        body: JSON.stringify(formulario),
      });

      setAviso({
        tipo: "sucesso",
        titulo: editando ? "Registro atualizado" : "Registro cadastrado",
        texto: dados.mensagem,
      });

      limparFormulario();
      setModalCadastroAberto(false);
      setBusca("");
      await carregarManutencoes("");
      await carregarEquipamentos();
    } catch (erro) {
      setAviso({ tipo: "erro", titulo: "Não foi possível salvar", texto: erro.message });
    } finally {
      setSalvando(false);
    }
  }

  function editarManutencao(manutencao) {
    setEditandoId(manutencao.id);
    setAviso(null);

    setFormulario({
      equipamento_id: manutencao.equipamento_id || "",
      tipo_ocorrencia: manutencao.tipo_ocorrencia || "manutencao",
      data_ocorrencia: manutencao.data_ocorrencia_input || dataHoraAtualInput(),
      responsavel_atendimento: manutencao.responsavel_atendimento || "",
      descricao: manutencao.descricao || "",
      custo: manutencao.custo || "",
      status: manutencao.status || "aberto",
    });

    setModalCadastroAberto(true);
  }

  async function excluirManutencao(manutencao) {
    const confirmar = window.confirm(
      `Deseja realmente remover este registro?\n\n${manutencao.tipo_ocorrencia_display} - ${nomeEquipamento(manutencao.equipamento)}`
    );

    if (!confirmar) {
      return;
    }

    try {
      const dados = await apiRequest(`/manutencoes/${manutencao.id}/`, {
        method: "DELETE",
      });

      setAviso({ tipo: "sucesso", titulo: "Registro removido", texto: dados.mensagem });
      await carregarManutencoes();
    } catch (erro) {
      setAviso({ tipo: "erro", titulo: "Erro ao remover", texto: erro.message });
    }
  }

  return (
    <div className="mx-auto max-w-[1500px]">
      {!modalCadastroAberto && <Aviso aviso={aviso} onFechar={() => setAviso(null)} />}

      <div className="mb-5 flex flex-col gap-4 border border-slate-200 bg-white p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">Histórico registrado</h2>
          <p className="mt-1 text-sm text-slate-500">
            Visualização rápida de manutenções, movimentações, status e responsáveis.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:w-96">
            <FiSearch size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar por equipamento, status, descrição..."
              className="w-full border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
            />
          </div>

          {podeEditar && (
            <button
              type="button"
              onClick={abrirNovoRegistro}
              className="flex items-center justify-center gap-2 bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 sm:py-2.5"
            >
              <FiPlus size={17} />
              Novo registro
            </button>
          )}
        </div>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ResumoCard titulo="Total" valor={resumo.total} descricao="Registros na lista" icone={FiActivity} />
        <ResumoCard titulo="Abertos" valor={resumo.abertos} descricao="Aguardando execução" icone={FiTool} />
        <ResumoCard titulo="Em andamento" valor={resumo.andamento} descricao="Sendo tratados" icone={FiCalendar} />
        <ResumoCard titulo="Concluídos" valor={resumo.concluidos} descricao="Finalizados" icone={FiUser} />
      </div>

      <section className="border border-slate-200 bg-white">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-black text-slate-950">Lista do histórico</h3>
            <p className="mt-1 text-sm text-slate-500">Total encontrado: {manutencoes.length}</p>
          </div>
          {carregando && <div className="text-sm font-semibold text-slate-500">Carregando...</div>}
        </div>

        <div className="space-y-4 bg-slate-50/60 p-4 sm:p-5">
          {carregando && manutencoes.length === 0 && (
            <div className="border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Carregando histórico...</div>
          )}

          {!carregando && manutencoes.length === 0 && (
            <div className="border border-slate-200 bg-white p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center text-slate-400">
                <FiTool size={26} />
              </div>
              <p className="mt-4 text-sm font-bold text-slate-800">Nenhum registro encontrado.</p>
              <p className="mt-1 text-sm text-slate-500">Registre uma manutenção ou ajuste a busca.</p>
            </div>
          )}

          {manutencoes.map((manutencao) => (
            <ManutencaoCard
              key={manutencao.id}
              manutencao={manutencao}
              aoEditar={editarManutencao}
              aoExcluir={excluirManutencao}
              podeEditar={podeEditar}
              podeExcluir={podeExcluir}
            />
          ))}
        </div>
      </section>

      {modalCadastroAberto && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <div className="absolute inset-0" onClick={fecharModalCadastro} />

          <div className="absolute inset-y-0 right-0 flex w-full justify-end">
            <div className="relative flex h-full w-full max-w-3xl flex-col bg-[#f4f5f7] shadow-2xl">
              <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-950">
                      {editandoId ? "Editar registro" : "Novo registro"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Registre manutenções, limpezas, movimentações e observações.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={fecharModalCadastro}
                    className="flex h-10 w-10 shrink-0 items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-100"
                    title="Fechar"
                  >
                    <FiX size={20} />
                  </button>
                </div>
              </div>

              <form onSubmit={salvarManutencao} className="flex min-h-0 flex-1 flex-col">
                <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                  <Aviso aviso={aviso} onFechar={() => setAviso(null)} />

                  <div className="space-y-5 pb-8">
                    <SecaoFormulario titulo="Equipamento e ocorrência" descricao="Selecione o item e informe o tipo de registro.">
                      <Campo label="Equipamento">
                        <select
                          name="equipamento_id"
                          value={formulario.equipamento_id}
                          onChange={atualizarCampo}
                          className={inputClasse}
                        >
                          <option value="">Selecione um equipamento</option>
                          {equipamentos.map((equipamento) => (
                            <option key={equipamento.id} value={equipamento.id}>{nomeEquipamento(equipamento)}</option>
                          ))}
                        </select>
                      </Campo>

                      <div className="grid gap-4 md:grid-cols-2">
                        <Campo label="Tipo de ocorrência">
                          <select
                            name="tipo_ocorrencia"
                            value={formulario.tipo_ocorrencia}
                            onChange={atualizarCampo}
                            className={inputClasse}
                          >
                            {tipos.map((tipo) => (
                              <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                            ))}
                          </select>
                        </Campo>

                        <Campo label="Status">
                          <select
                            name="status"
                            value={formulario.status}
                            onChange={atualizarCampo}
                            className={inputClasse}
                          >
                            {statusOpcoes.map((status) => (
                              <option key={status.value} value={status.value}>{status.label}</option>
                            ))}
                          </select>
                        </Campo>
                      </div>
                    </SecaoFormulario>

                    <SecaoFormulario titulo="Atendimento" descricao="Dados do responsável, data, custo e descrição do serviço.">
                      <div className="grid gap-4 md:grid-cols-2">
                        <Campo label="Data da ocorrência">
                          <input
                            type="datetime-local"
                            name="data_ocorrencia"
                            value={formulario.data_ocorrencia}
                            onChange={atualizarCampo}
                            className={inputClasse}
                          />
                        </Campo>

                        <Campo label="Responsável pelo atendimento">
                          <input
                            type="text"
                            name="responsavel_atendimento"
                            value={formulario.responsavel_atendimento}
                            onChange={atualizarCampo}
                            placeholder="Ex: João, Kauã, técnico externo..."
                            className={inputClasse}
                          />
                        </Campo>

                        <Campo label="Custo">
                          <input
                            type="text"
                            inputMode="numeric"
                            name="custo"
                            value={formatarMoeda(formulario.custo)}
                            onChange={(evento) => atualizarCampoMoeda(evento, "custo")}
                            placeholder="R$ 0,00"
                            className={inputClasse}
                          />
                          <p className="mt-1 text-xs text-slate-500">Digite apenas os números. Ex: 15000 vira R$ 150,00.</p>
                        </Campo>
                      </div>

                      <Campo label="Descrição do serviço">
                        <textarea
                          name="descricao"
                          value={formulario.descricao}
                          onChange={atualizarCampo}
                          placeholder="Ex: realizada limpeza interna, troca de SSD, formatação, instalação de drivers..."
                          rows={5}
                          className="w-full resize-none border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
                        />
                      </Campo>
                    </SecaoFormulario>
                  </div>
                </div>

                <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={fecharModalCadastro}
                      disabled={salvando}
                      className="border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60 sm:min-w-32"
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      disabled={salvando}
                      className="bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-52"
                    >
                      {salvando
                        ? "Salvando..."
                        : editandoId
                          ? "Atualizar registro"
                          : "Cadastrar registro"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
