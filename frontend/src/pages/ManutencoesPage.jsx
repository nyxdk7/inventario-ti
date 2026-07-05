import { useEffect, useState } from "react";

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
          <p className="font-semibold">
            {aviso.titulo}
          </p>

          {aviso.texto && (
            <p className="mt-1 text-sm">
              {aviso.texto}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onFechar}
          className="text-sm font-bold opacity-70 hover:opacity-100"
        >
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

function CardInfo({ titulo, valor }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {titulo}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {valor || "-"}
      </p>
    </div>
  );
}

function ManutencaoCardMobile({ manutencao, aoEditar, aoExcluir }) {
  return (
    <div className="border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="break-words text-base font-bold text-slate-950">
            {manutencao.tipo_ocorrencia_display}
          </h3>

          <p className="mt-1 break-words text-sm leading-6 text-slate-500">
            {nomeEquipamento(manutencao.equipamento)}
          </p>
        </div>

        <div>
          <span className={`inline-flex border px-2 py-1 text-xs font-bold ${badgeStatus(manutencao.status)}`}>
            {manutencao.status_display}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
        <CardInfo titulo="Data" valor={manutencao.data_ocorrencia} />
        <CardInfo titulo="Responsável" valor={manutencao.responsavel_atendimento} />
        <CardInfo titulo="Setor" valor={manutencao.equipamento?.setor?.nome || "Sem setor"} />
        <CardInfo titulo="Custo" valor={manutencao.custo ? formatarMoeda(manutencao.custo) : "-"} />
      </div>

      <div className="mt-4 border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Descrição
        </p>

        <p className="mt-1 line-clamp-4 break-words text-sm leading-6 text-slate-700">
          {manutencao.descricao || "-"}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => aoEditar(manutencao)}
          className="border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
        >
          Editar
        </button>

        <button
          type="button"
          onClick={() => aoExcluir(manutencao)}
          className="border border-red-200 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-50"
        >
          Excluir
        </button>
      </div>
    </div>
  );
}

export default function ManutencoesPage() {
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

  async function carregarEquipamentos() {
    try {
      const dados = await apiRequest("/equipamentos/");
      setEquipamentos(dados.resultados || []);
    } catch (erro) {
      setAviso({
        tipo: "erro",
        titulo: "Erro ao carregar equipamentos",
        texto: erro.message,
      });
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
      setAviso({
        tipo: "erro",
        titulo: "Erro ao carregar históricos",
        texto: erro.message,
      });
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

    setFormulario((estadoAtual) => ({
      ...estadoAtual,
      [name]: value,
    }));
  }

  function atualizarCampoMoeda(evento, campo) {
    const decimal = moedaParaDecimal(evento.target.value);

    setFormulario((estadoAtual) => ({
      ...estadoAtual,
      [campo]: decimal,
    }));
  }

  function limparFormulario() {
    setFormulario({
      ...formularioInicial,
      data_ocorrencia: dataHoraAtualInput(),
    });
    setEditandoId(null);
  }

  async function salvarManutencao(evento) {
    evento.preventDefault();

    setSalvando(true);
    setAviso(null);

    const editando = Boolean(editandoId);

    const endpoint = editando
      ? `/manutencoes/${editandoId}/`
      : "/manutencoes/";

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
      setBusca("");
      await carregarManutencoes("");
      await carregarEquipamentos();
    } catch (erro) {
      setAviso({
        tipo: "erro",
        titulo: "Não foi possível salvar",
        texto: erro.message,
      });
    } finally {
      setSalvando(false);
    }
  }

  function editarManutencao(manutencao) {
    setEditandoId(manutencao.id);

    setFormulario({
      equipamento_id: manutencao.equipamento_id || "",
      tipo_ocorrencia: manutencao.tipo_ocorrencia || "manutencao",
      data_ocorrencia: manutencao.data_ocorrencia_input || dataHoraAtualInput(),
      responsavel_atendimento: manutencao.responsavel_atendimento || "",
      descricao: manutencao.descricao || "",
      custo: manutencao.custo || "",
      status: manutencao.status || "aberto",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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

      setAviso({
        tipo: "sucesso",
        titulo: "Registro removido",
        texto: dados.mensagem,
      });

      await carregarManutencoes();
    } catch (erro) {
      setAviso({
        tipo: "erro",
        titulo: "Erro ao remover",
        texto: erro.message,
      });
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <Aviso aviso={aviso} onFechar={() => setAviso(null)} />

      <section className="grid gap-6 xl:grid-cols-[460px_1fr]">
        <div className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
            <h2 className="text-base font-bold text-slate-950">
              {editandoId ? "Editar registro" : "Novo registro"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Registre manutenções, limpezas, movimentações e observações.
            </p>
          </div>

          <form onSubmit={salvarManutencao} className="space-y-4 p-4 sm:p-5">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Equipamento
              </label>

              <select
                name="equipamento_id"
                value={formulario.equipamento_id}
                onChange={atualizarCampo}
                className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
              >
                <option value="">Selecione um equipamento</option>

                {equipamentos.map((equipamento) => (
                  <option key={equipamento.id} value={equipamento.id}>
                    {nomeEquipamento(equipamento)}
                  </option>
                ))}
              </select>

              {equipamentos.length === 0 && (
                <p className="mt-1 text-xs text-amber-700">
                  Nenhum equipamento cadastrado ainda. Cadastre em Equipamentos no menu lateral.
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Tipo de ocorrência
                </label>

                <select
                  name="tipo_ocorrencia"
                  value={formulario.tipo_ocorrencia}
                  onChange={atualizarCampo}
                  className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
                >
                  {tipos.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Status
                </label>

                <select
                  name="status"
                  value={formulario.status}
                  onChange={atualizarCampo}
                  className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
                >
                  {statusOpcoes.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Data da ocorrência
              </label>

              <input
                type="datetime-local"
                name="data_ocorrencia"
                value={formulario.data_ocorrencia}
                onChange={atualizarCampo}
                className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Responsável pelo atendimento
              </label>

              <input
                type="text"
                name="responsavel_atendimento"
                value={formulario.responsavel_atendimento}
                onChange={atualizarCampo}
                placeholder="Ex: João, Kauã, técnico externo..."
                className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Custo
              </label>

              <input
                type="text"
                inputMode="numeric"
                name="custo"
                value={formatarMoeda(formulario.custo)}
                onChange={(evento) => atualizarCampoMoeda(evento, "custo")}
                placeholder="R$ 0,00"
                className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
              />

              <p className="mt-1 text-xs text-slate-500">
                Digite apenas os números. Ex: 15000 vira R$ 150,00.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Descrição do serviço
              </label>

              <textarea
                name="descricao"
                value={formulario.descricao}
                onChange={atualizarCampo}
                placeholder="Ex: realizada limpeza interna, troca de SSD, formatação, instalação de drivers..."
                rows={5}
                className="w-full resize-none border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={salvando}
                className="flex-1 bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvando
                  ? "Salvando..."
                  : editandoId
                    ? "Atualizar registro"
                    : "Cadastrar registro"}
              </button>

              {editandoId && (
                <button
                  type="button"
                  onClick={limparFormulario}
                  className="border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="border border-slate-200 bg-white">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-950">
                Histórico registrado
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Total encontrado: {manutencoes.length}
              </p>
            </div>

            <input
              type="text"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar por equipamento, status, descrição..."
              className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 lg:max-w-xs lg:py-2.5"
            />
          </div>

          <div className="p-4 lg:hidden">
            {carregando && (
              <div className="border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
                Carregando histórico...
              </div>
            )}

            {!carregando && manutencoes.length === 0 && (
              <div className="border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
                Nenhum registro encontrado ainda.
              </div>
            )}

            {!carregando && manutencoes.length > 0 && (
              <div className="space-y-4">
                {manutencoes.map((manutencao) => (
                  <ManutencaoCardMobile
                    key={manutencao.id}
                    manutencao={manutencao}
                    aoEditar={editarManutencao}
                    aoExcluir={excluirManutencao}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Equipamento</th>
                  <th className="px-5 py-3">Ocorrência</th>
                  <th className="px-5 py-3">Data</th>
                  <th className="px-5 py-3">Responsável</th>
                  <th className="px-5 py-3">Custo</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>

              <tbody>
                {carregando && (
                  <tr>
                    <td colSpan="7" className="px-5 py-8 text-center text-slate-500">
                      Carregando histórico...
                    </td>
                  </tr>
                )}

                {!carregando && manutencoes.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-5 py-8 text-center text-slate-500">
                      Nenhum registro encontrado ainda.
                    </td>
                  </tr>
                )}

                {!carregando && manutencoes.map((manutencao) => (
                  <tr key={manutencao.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-950">
                        {nomeEquipamento(manutencao.equipamento)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {manutencao.equipamento?.setor?.nome || "Sem setor"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">
                        {manutencao.tipo_ocorrencia_display}
                      </p>
                      <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                        {manutencao.descricao}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {manutencao.data_ocorrencia}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {manutencao.responsavel_atendimento || "-"}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {manutencao.custo ? formatarMoeda(manutencao.custo) : "-"}
                    </td>

                    <td className="px-5 py-4">
                      <span className={`inline-flex border px-2 py-1 text-xs font-bold ${badgeStatus(manutencao.status)}`}>
                        {manutencao.status_display}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => editarManutencao(manutencao)}
                          className="border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => excluirManutencao(manutencao)}
                          className="border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}