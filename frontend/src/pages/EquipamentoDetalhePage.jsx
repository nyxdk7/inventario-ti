import { useEffect, useRef, useState } from "react";

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
    return "-";
  }

  const digitos = somenteDigitos(texto);

  if (!digitos) {
    return "-";
  }

  const numero = Number(digitos) / 100;

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data) {
  if (!data) {
    return "-";
  }

  const partes = String(data).split("-");

  if (partes.length !== 3) {
    return data;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

const formularioHistoricoInicial = {
  tipo_ocorrencia: "observacao",
  data_ocorrencia: dataHoraAtualInput(),
  responsavel_atendimento: "",
  descricao: "",
  custo: "",
  status: "concluido",
};

const tiposHistoricoPadrao = [
  { value: "manutencao", label: "Manutenção" },
  { value: "troca_peca", label: "Troca de peça" },
  { value: "formatacao", label: "Formatação" },
  { value: "limpeza", label: "Limpeza" },
  { value: "instalacao_software", label: "Instalação de software" },
  { value: "baixa", label: "Baixa" },
  { value: "movimentacao", label: "Movimentação de setor" },
  { value: "observacao", label: "Observação geral" },
];

const statusHistoricoPadrao = [
  { value: "aberto", label: "Aberto" },
  { value: "andamento", label: "Em andamento" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
];

function badgeEquipamento(status) {
  if (status === "em_uso") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "estoque") {
    return "border-sky-200 bg-sky-50 text-sky-800";
  }

  if (status === "manutencao") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

function badgeHistorico(status) {
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

function CampoInfo({ titulo, valor }) {
  return (
    <div className="border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {titulo}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-slate-900">
        {valor || "-"}
      </p>
    </div>
  );
}

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

function BotaoPrincipal({ children, ...props }) {
  return (
    <button
      {...props}
      className={[
        "w-full bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60",
        props.className || "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function EquipamentoDetalhePage({ equipamentoId, aoVoltar }) {
  const [equipamento, setEquipamento] = useState(null);
  const [manutencoes, setManutencoes] = useState([]);
  const [tiposHistorico, setTiposHistorico] = useState(tiposHistoricoPadrao);
  const [statusHistorico, setStatusHistorico] = useState(statusHistoricoPadrao);
  const [formularioHistorico, setFormularioHistorico] = useState(formularioHistoricoInicial);
  const [fotosSelecionadas, setFotosSelecionadas] = useState([]);
  const [fotoAbertaIndex, setFotoAbertaIndex] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvandoHistorico, setSalvandoHistorico] = useState(false);
  const [salvandoFotos, setSalvandoFotos] = useState(false);
  const [aviso, setAviso] = useState(null);

  const inputFotosRef = useRef(null);
  const toqueInicioXRef = useRef(null);

  const fotos = equipamento?.fotos || [];
  const fotoAberta = fotoAbertaIndex !== null ? fotos[fotoAbertaIndex] : null;

  async function carregarDetalhes() {
    setCarregando(true);

    try {
      const dados = await apiRequest(`/equipamentos/${equipamentoId}/`);

      setEquipamento(dados.equipamento || null);
      setManutencoes(dados.manutencoes || []);
      setTiposHistorico(dados.opcoes_manutencao?.tipos || tiposHistoricoPadrao);
      setStatusHistorico(dados.opcoes_manutencao?.status || statusHistoricoPadrao);
    } catch (erro) {
      setAviso({
        tipo: "erro",
        titulo: "Erro ao carregar detalhes",
        texto: erro.message,
      });
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDetalhes();
  }, [equipamentoId]);

  useEffect(() => {
    function controlarTeclas(evento) {
      if (fotoAbertaIndex === null) {
        return;
      }

      if (evento.key === "Escape") {
        fecharFotoAberta();
      }

      if (evento.key === "ArrowLeft") {
        fotoAnterior();
      }

      if (evento.key === "ArrowRight") {
        proximaFoto();
      }
    }

    window.addEventListener("keydown", controlarTeclas);

    return () => {
      window.removeEventListener("keydown", controlarTeclas);
    };
  }, [fotoAbertaIndex, fotos.length]);

  function abrirFoto(index) {
    setFotoAbertaIndex(index);
  }

  function fecharFotoAberta() {
    setFotoAbertaIndex(null);
    toqueInicioXRef.current = null;
  }

  function fotoAnterior() {
    if (fotos.length === 0) {
      return;
    }

    setFotoAbertaIndex((indexAtual) => {
      if (indexAtual === null) {
        return 0;
      }

      if (indexAtual === 0) {
        return fotos.length - 1;
      }

      return indexAtual - 1;
    });
  }

  function proximaFoto() {
    if (fotos.length === 0) {
      return;
    }

    setFotoAbertaIndex((indexAtual) => {
      if (indexAtual === null) {
        return 0;
      }

      if (indexAtual >= fotos.length - 1) {
        return 0;
      }

      return indexAtual + 1;
    });
  }

  function iniciarToque(evento) {
    toqueInicioXRef.current = evento.touches[0].clientX;
  }

  function finalizarToque(evento) {
    if (toqueInicioXRef.current === null) {
      return;
    }

    const toqueFinalX = evento.changedTouches[0].clientX;
    const diferenca = toqueInicioXRef.current - toqueFinalX;

    if (Math.abs(diferenca) > 50) {
      if (diferenca > 0) {
        proximaFoto();
      } else {
        fotoAnterior();
      }
    }

    toqueInicioXRef.current = null;
  }

  function atualizarHistorico(evento) {
    const { name, value } = evento.target;

    setFormularioHistorico((estadoAtual) => ({
      ...estadoAtual,
      [name]: value,
    }));
  }

  function atualizarHistoricoMoeda(evento) {
    const decimal = moedaParaDecimal(evento.target.value);

    setFormularioHistorico((estadoAtual) => ({
      ...estadoAtual,
      custo: decimal,
    }));
  }

  function atualizarFotos(evento) {
    setFotosSelecionadas(Array.from(evento.target.files || []));
  }

  async function salvarHistorico(evento) {
    evento.preventDefault();

    setSalvandoHistorico(true);
    setAviso(null);

    try {
      const dados = await apiRequest("/manutencoes/", {
        method: "POST",
        body: JSON.stringify({
          ...formularioHistorico,
          equipamento_id: equipamentoId,
        }),
      });

      setAviso({
        tipo: "sucesso",
        titulo: "Histórico registrado",
        texto: dados.mensagem,
      });

      setFormularioHistorico({
        ...formularioHistoricoInicial,
        data_ocorrencia: dataHoraAtualInput(),
      });

      await carregarDetalhes();
    } catch (erro) {
      setAviso({
        tipo: "erro",
        titulo: "Não foi possível salvar o histórico",
        texto: erro.message,
      });
    } finally {
      setSalvandoHistorico(false);
    }
  }

  async function anexarFotos(evento) {
    evento.preventDefault();

    if (fotosSelecionadas.length === 0) {
      setAviso({
        tipo: "erro",
        titulo: "Nenhuma foto selecionada",
        texto: "Selecione pelo menos uma foto para anexar.",
      });
      return;
    }

    setSalvandoFotos(true);
    setAviso(null);

    try {
      const formData = new FormData();

      fotosSelecionadas.forEach((foto) => {
        formData.append("fotos", foto);
      });

      const dados = await apiRequest(`/equipamentos/${equipamentoId}/fotos/`, {
        method: "POST",
        body: formData,
      });

      setAviso({
        tipo: "sucesso",
        titulo: "Foto anexada",
        texto: dados.mensagem,
      });

      setFotosSelecionadas([]);

      if (inputFotosRef.current) {
        inputFotosRef.current.value = "";
      }

      await carregarDetalhes();
    } catch (erro) {
      setAviso({
        tipo: "erro",
        titulo: "Erro ao anexar foto",
        texto: erro.message,
      });
    } finally {
      setSalvandoFotos(false);
    }
  }

  async function excluirFoto(foto) {
    const confirmar = window.confirm("Deseja remover esta foto?");

    if (!confirmar) {
      return;
    }

    try {
      const dados = await apiRequest(`/equipamentos/fotos/${foto.id}/`, {
        method: "DELETE",
      });

      setAviso({
        tipo: "sucesso",
        titulo: "Foto removida",
        texto: dados.mensagem,
      });

      fecharFotoAberta();
      await carregarDetalhes();
    } catch (erro) {
      setAviso({
        tipo: "erro",
        titulo: "Erro ao remover foto",
        texto: erro.message,
      });
    }
  }

  if (carregando) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Carregando detalhes do equipamento...
        </div>
      </div>
    );
  }

  if (!equipamento) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="border border-red-200 bg-red-50 p-6 text-red-900">
          <p className="font-bold">
            Equipamento não encontrado.
          </p>

          <button
            type="button"
            onClick={aoVoltar}
            className="mt-4 w-full border border-red-300 px-4 py-3 text-sm font-bold hover:bg-red-100 sm:w-auto"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const tituloEquipamento = [
    equipamento.tipo_display,
    equipamento.marca,
    equipamento.modelo,
  ].filter(Boolean).join(" - ");

  return (
    <div className="mx-auto max-w-7xl">
      <Aviso aviso={aviso} onFechar={() => setAviso(null)} />

      <div className="mb-5 border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <button
              type="button"
              onClick={aoVoltar}
              className="mb-4 w-full border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 sm:w-auto sm:px-3 sm:py-2 sm:text-xs"
            >
              Voltar para equipamentos
            </button>

            <h2 className="break-words text-xl font-bold text-slate-950 sm:text-2xl">
              {tituloEquipamento || "Equipamento"}
            </h2>

            <p className="mt-2 break-words text-sm text-slate-500">
              Patrimônio: {equipamento.patrimonio || "-"} · Série: {equipamento.numero_serie || "-"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {equipamento.produto_novo && (
              <span className="border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-800">
                Produto novo
              </span>
            )}

            <span className={`border px-3 py-2 text-xs font-bold ${badgeEquipamento(equipamento.status)}`}>
              {equipamento.status_display}
            </span>
          </div>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
              <h3 className="text-base font-bold text-slate-950">
                Dados principais
              </h3>
            </div>

            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-5 lg:grid-cols-3">
              <CampoInfo titulo="Tipo" valor={equipamento.tipo_display} />
              <CampoInfo titulo="Patrimônio" valor={equipamento.patrimonio} />
              <CampoInfo titulo="Número de série" valor={equipamento.numero_serie} />
              <CampoInfo titulo="Marca" valor={equipamento.marca} />
              <CampoInfo titulo="Modelo" valor={equipamento.modelo} />
              <CampoInfo titulo="Setor" valor={equipamento.setor?.nome} />
              <CampoInfo titulo="Responsável" valor={equipamento.usuario_responsavel} />
              <CampoInfo titulo="Status" valor={equipamento.status_display} />
              <CampoInfo titulo="Atualizado em" valor={equipamento.atualizado_em} />
            </div>

            {equipamento.observacoes && (
              <div className="border-t border-slate-200 p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Observações
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                  {equipamento.observacoes}
                </p>
              </div>
            )}
          </div>

          <div className="border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
              <h3 className="text-base font-bold text-slate-950">
                Dados de compra / almoxarifado
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Informações usadas quando o item entra como produto novo.
              </p>
            </div>

            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-5 lg:grid-cols-3">
              <CampoInfo titulo="Produto novo" valor={equipamento.produto_novo ? "Sim" : "Não"} />
              <CampoInfo titulo="Origem" valor={equipamento.origem_display} />
              <CampoInfo titulo="Data de compra" valor={formatarData(equipamento.data_compra)} />
              <CampoInfo titulo="Fornecedor" valor={equipamento.fornecedor} />
              <CampoInfo titulo="Nota fiscal" valor={equipamento.numero_nota_fiscal} />
              <CampoInfo titulo="Valor de compra" valor={equipamento.valor_compra ? formatarMoeda(equipamento.valor_compra) : "-"} />
              <CampoInfo titulo="Garantia até" valor={formatarData(equipamento.garantia_ate)} />
            </div>
          </div>

          <div className="border border-slate-200 bg-white">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-950">
                  Histórico do equipamento
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Registros de manutenção, limpeza, movimentação e observações.
                </p>
              </div>

              <span className="text-sm font-bold text-slate-600">
                {manutencoes.length} registro(s)
              </span>
            </div>

            <div className="p-4 sm:p-5">
              {manutencoes.length === 0 && (
                <div className="border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  Nenhum histórico registrado para este equipamento.
                </div>
              )}

              {manutencoes.length > 0 && (
                <div className="space-y-3">
                  {manutencoes.map((item) => (
                    <div key={item.id} className="border border-slate-200 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="break-words font-bold text-slate-950">
                            {item.tipo_ocorrencia_display}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {item.data_ocorrencia}
                          </p>
                          <p className="text-xs leading-5 text-slate-500">
                            Responsável: {item.responsavel_atendimento || "-"}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {item.custo && (
                            <span className="border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700">
                              {formatarMoeda(item.custo)}
                            </span>
                          )}

                          <span className={`border px-2 py-1 text-xs font-bold ${badgeHistorico(item.status)}`}>
                            {item.status_display}
                          </span>
                        </div>
                      </div>

                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                        {item.descricao}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
              <h3 className="text-base font-bold text-slate-950">
                Fotos
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Clique em uma imagem para abrir a galeria.
              </p>
            </div>

            <div className="p-4 sm:p-5">
              {fotos.length === 0 && (
                <div className="border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  Nenhuma foto anexada ainda.
                </div>
              )}

              {fotos.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  {fotos.map((foto, index) => (
                    <div key={foto.id} className="border border-slate-200 bg-white p-2">
                      <button
                        type="button"
                        onClick={() => abrirFoto(index)}
                        className="block w-full text-left"
                        title="Abrir imagem"
                      >
                        <img
                          src={foto.url}
                          alt="Foto do equipamento"
                          className="h-56 w-full object-cover hover:opacity-90 sm:h-44"
                        />
                      </button>

                      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-500">
                          {foto.criado_em}
                        </p>

                        <button
                          type="button"
                          onClick={() => excluirFoto(foto)}
                          className="w-full border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 sm:w-auto"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={anexarFotos} className="mt-5 border border-slate-200 p-4">
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Anexar novas fotos
                </label>

                <input
                  ref={inputFotosRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={atualizarFotos}
                  className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950"
                />

                {fotosSelecionadas.length > 0 && (
                  <p className="mt-2 text-xs font-semibold text-slate-700">
                    {fotosSelecionadas.length} foto(s) selecionada(s).
                  </p>
                )}

                <BotaoPrincipal
                  type="submit"
                  disabled={salvandoFotos}
                  className="mt-3"
                >
                  {salvandoFotos ? "Anexando..." : "Anexar foto(s)"}
                </BotaoPrincipal>
              </form>
            </div>
          </div>

          <div className="border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
              <h3 className="text-base font-bold text-slate-950">
                Novo registro no histórico
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Adicione um evento diretamente neste equipamento.
              </p>
            </div>

            <form onSubmit={salvarHistorico} className="space-y-4 p-4 sm:p-5">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Tipo de ocorrência
                </label>

                <select
                  name="tipo_ocorrencia"
                  value={formularioHistorico.tipo_ocorrencia}
                  onChange={atualizarHistorico}
                  className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
                >
                  {tiposHistorico.map((tipo) => (
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
                  value={formularioHistorico.status}
                  onChange={atualizarHistorico}
                  className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
                >
                  {statusHistorico.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Data da ocorrência
                </label>

                <input
                  type="datetime-local"
                  name="data_ocorrencia"
                  value={formularioHistorico.data_ocorrencia}
                  onChange={atualizarHistorico}
                  className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Responsável
                </label>

                <input
                  type="text"
                  name="responsavel_atendimento"
                  value={formularioHistorico.responsavel_atendimento}
                  onChange={atualizarHistorico}
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
                  value={formularioHistorico.custo ? formatarMoeda(formularioHistorico.custo) : ""}
                  onChange={atualizarHistoricoMoeda}
                  placeholder="R$ 0,00"
                  className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Descrição
                </label>

                <textarea
                  name="descricao"
                  value={formularioHistorico.descricao}
                  onChange={atualizarHistorico}
                  placeholder="Ex: equipamento entregue ao usuário, limpeza realizada, troca de SSD..."
                  rows={5}
                  className="w-full resize-none border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
                />
              </div>

              <BotaoPrincipal
                type="submit"
                disabled={salvandoHistorico}
              >
                {salvandoHistorico ? "Salvando..." : "Adicionar ao histórico"}
              </BotaoPrincipal>
            </form>
          </div>
        </div>
      </section>

      {fotoAberta && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-3 sm:p-4"
          onClick={fecharFotoAberta}
          onTouchStart={iniciarToque}
          onTouchEnd={finalizarToque}
        >
          <div
            className="relative flex h-full w-full max-w-6xl flex-col"
            onClick={(evento) => evento.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3 text-white">
              <div>
                <p className="text-sm font-bold">
                  Foto {fotoAbertaIndex + 1} de {fotos.length}
                </p>
                <p className="text-xs text-white/60">
                  {fotoAberta.criado_em}
                </p>
              </div>

              <button
                type="button"
                onClick={fecharFotoAberta}
                className="flex h-11 w-11 items-center justify-center border border-white/30 bg-white/10 text-xl font-bold text-white hover:bg-white/20"
                title="Fechar"
              >
                X
              </button>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center">
              {fotos.length > 1 && (
                <button
                  type="button"
                  onClick={fotoAnterior}
                  className="absolute left-0 z-10 hidden h-12 w-12 items-center justify-center border border-white/30 bg-black/40 text-3xl font-bold text-white hover:bg-white/20 sm:flex"
                  title="Foto anterior"
                >
                  ‹
                </button>
              )}

              <img
                src={fotoAberta.url}
                alt="Foto ampliada do equipamento"
                className="max-h-full max-w-full object-contain"
              />

              {fotos.length > 1 && (
                <button
                  type="button"
                  onClick={proximaFoto}
                  className="absolute right-0 z-10 hidden h-12 w-12 items-center justify-center border border-white/30 bg-black/40 text-3xl font-bold text-white hover:bg-white/20 sm:flex"
                  title="Próxima foto"
                >
                  ›
                </button>
              )}
            </div>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center justify-between gap-2 sm:hidden">
                <button
                  type="button"
                  onClick={fotoAnterior}
                  disabled={fotos.length <= 1}
                  className="flex-1 border border-white/30 bg-white/10 px-4 py-3 text-sm font-bold text-white disabled:opacity-40"
                >
                  Anterior
                </button>

                <button
                  type="button"
                  onClick={proximaFoto}
                  disabled={fotos.length <= 1}
                  className="flex-1 border border-white/30 bg-white/10 px-4 py-3 text-sm font-bold text-white disabled:opacity-40"
                >
                  Próxima
                </button>
              </div>

              <p className="text-center text-xs text-white/60 sm:text-left">
                No celular, arraste para o lado para passar as fotos. ESC fecha no computador.
              </p>

              <button
                type="button"
                onClick={() => excluirFoto(fotoAberta)}
                className="w-full border border-red-300 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100 hover:bg-red-500/20 sm:w-auto sm:py-2"
              >
                Remover esta foto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}