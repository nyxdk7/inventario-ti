import { useEffect, useRef, useState } from "react";

import { apiRequest } from "../services/api";

const formularioInicial = {
  tipo: "desktop",
  patrimonio: "",
  marca: "",
  modelo: "",
  numero_serie: "",
  setor_id: "",
  usuario_responsavel: "",
  status: "em_uso",
  produto_novo: false,
  data_compra: "",
  fornecedor: "",
  numero_nota_fiscal: "",
  valor_compra: "",
  garantia_ate: "",
  origem: "",
  observacoes: "",
};

const tiposPadrao = [
  { value: "desktop", label: "Desktop" },
  { value: "notebook", label: "Notebook" },
  { value: "impressora", label: "Impressora" },
  { value: "monitor", label: "Monitor" },
  { value: "roteador", label: "Roteador" },
  { value: "switch", label: "Switch" },
  { value: "nobreak", label: "Nobreak" },
  { value: "celular", label: "Celular" },
  { value: "tablet", label: "Tablet" },
  { value: "outro", label: "Outro" },
];

const statusPadrao = [
  { value: "em_uso", label: "Em uso" },
  { value: "estoque", label: "Em estoque" },
  { value: "manutencao", label: "Em manutenção" },
  { value: "inativo", label: "Baixado/Inativo" },
];

const origensPadrao = [
  { value: "compra", label: "Compra" },
  { value: "doacao", label: "Doação" },
  { value: "transferencia", label: "Transferência" },
  { value: "reaproveitamento", label: "Reaproveitamento" },
];

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

function Aviso({ aviso, onFechar }) {
  if (!aviso) {
    return null;
  }

  const estilos = {
    sucesso: "border-emerald-200 bg-emerald-50 text-emerald-900",
    erro: "border-red-200 bg-red-50 text-red-900",
    duplicado: "border-amber-200 bg-amber-50 text-amber-950",
  };

  return (
    <div className={`mb-5 border p-4 ${estilos[aviso.tipo] || estilos.erro}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">{aviso.titulo}</p>

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

      {aviso.duplicados?.length > 0 && (
        <div className="mt-4 overflow-x-auto border border-amber-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-amber-100 text-xs uppercase tracking-wide text-amber-950">
              <tr>
                <th className="px-3 py-2">Conflito</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Patrimônio</th>
                <th className="px-3 py-2">Série</th>
                <th className="px-3 py-2">Modelo</th>
              </tr>
            </thead>

            <tbody>
              {aviso.duplicados.map((item) => (
                <tr key={item.id} className="border-t border-amber-100">
                  <td className="px-3 py-2 font-semibold">
                    {item.conflitos?.join(" / ")}
                  </td>
                  <td className="px-3 py-2">{item.tipo_display}</td>
                  <td className="px-3 py-2">{item.patrimonio || "-"}</td>
                  <td className="px-3 py-2">{item.numero_serie || "-"}</td>
                  <td className="px-3 py-2">
                    {[item.marca, item.modelo].filter(Boolean).join(" ") || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function badgeStatus(status) {
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

function descricaoEquipamento(equipamento) {
  return [equipamento.marca, equipamento.modelo].filter(Boolean).join(" ") || "-";
}

function CardInfo({ titulo, valor }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {titulo}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-800">
        {valor || "-"}
      </p>
    </div>
  );
}

function EquipamentoCardMobile({
  equipamento,
  aoVerDetalhes,
  aoEditar,
  aoExcluir,
}) {
  const fotoPrincipal = equipamento.fotos?.[0];

  return (
    <div className="border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-4">
        <div className="h-20 w-20 shrink-0 border border-slate-200 bg-slate-100">
          {fotoPrincipal ? (
            <img
              src={fotoPrincipal.url}
              alt="Foto do equipamento"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-400">
              Sem foto
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-slate-950">
              {equipamento.tipo_display}
            </h3>

            {equipamento.produto_novo && (
              <span className="border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-bold text-sky-800">
                Novo
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {descricaoEquipamento(equipamento)}
          </p>

          <div className="mt-2">
            <span className={`inline-flex border px-2 py-1 text-xs font-bold ${badgeStatus(equipamento.status)}`}>
              {equipamento.status_display}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
        <CardInfo titulo="Patrimônio" valor={equipamento.patrimonio} />
        <CardInfo titulo="Série" valor={equipamento.numero_serie} />
        <CardInfo titulo="Setor" valor={equipamento.setor?.nome} />
        <CardInfo titulo="Responsável" valor={equipamento.usuario_responsavel} />
      </div>

      {equipamento.produto_novo && (
        <div className="mt-4 border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Compra / origem
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-800">
            {equipamento.origem_display || "Origem não informada"}
            {equipamento.valor_compra ? ` · ${formatarMoeda(equipamento.valor_compra)}` : ""}
          </p>

          {equipamento.garantia_ate && (
            <p className="mt-1 text-xs text-slate-500">
              Garantia até: {equipamento.garantia_ate}
            </p>
          )}
        </div>
      )}

      {equipamento.fotos?.length > 0 && (
        <p className="mt-3 text-xs font-semibold text-slate-500">
          {equipamento.fotos.length} foto(s) anexada(s)
        </p>
      )}

      <div className="mt-4 grid gap-2">
        <button
          type="button"
          onClick={() => aoVerDetalhes?.(equipamento.id)}
          className="w-full border border-slate-950 bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800"
        >
          Ver detalhes
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => aoEditar(equipamento)}
            className="border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
          >
            Editar
          </button>

          <button
            type="button"
            onClick={() => aoExcluir(equipamento)}
            className="border border-red-200 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-50"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EquipamentosPage({ aoVerDetalhes }) {
  const [equipamentos, setEquipamentos] = useState([]);
  const [setores, setSetores] = useState([]);
  const [tipos, setTipos] = useState(tiposPadrao);
  const [statusOpcoes, setStatusOpcoes] = useState(statusPadrao);
  const [origens, setOrigens] = useState(origensPadrao);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [editandoId, setEditandoId] = useState(null);
  const [fotosSelecionadas, setFotosSelecionadas] = useState([]);
  const [fotosAtuais, setFotosAtuais] = useState([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState(null);

  const inputFotosRef = useRef(null);

  async function carregarSetores() {
    try {
      const dados = await apiRequest("/setores/");
      setSetores(dados.resultados || []);
    } catch (erro) {
      setAviso({
        tipo: "erro",
        titulo: "Erro ao carregar setores",
        texto: erro.message,
      });
    }
  }

  async function carregarEquipamentos(termoBusca = busca) {
    setCarregando(true);

    try {
      const query = termoBusca.trim()
        ? `?q=${encodeURIComponent(termoBusca.trim())}`
        : "";

      const dados = await apiRequest(`/equipamentos/${query}`);

      setEquipamentos(dados.resultados || []);
      setTipos(dados.opcoes?.tipos || tiposPadrao);
      setStatusOpcoes(dados.opcoes?.status || statusPadrao);
      setOrigens(dados.opcoes?.origens || origensPadrao);
    } catch (erro) {
      setAviso({
        tipo: "erro",
        titulo: "Erro ao carregar equipamentos",
        texto: erro.message,
      });
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarSetores();
  }, []);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      carregarEquipamentos(busca);
    }, 250);

    return () => clearTimeout(temporizador);
  }, [busca]);

  function atualizarCampo(evento) {
    const { name, value, type, checked } = evento.target;

    setFormulario((estadoAtual) => {
      const novoEstado = {
        ...estadoAtual,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "produto_novo" && !checked) {
        novoEstado.data_compra = "";
        novoEstado.fornecedor = "";
        novoEstado.numero_nota_fiscal = "";
        novoEstado.valor_compra = "";
        novoEstado.garantia_ate = "";
        novoEstado.origem = "";
      }

      return novoEstado;
    });
  }

  function atualizarCampoMoeda(evento, campo) {
    const decimal = moedaParaDecimal(evento.target.value);

    setFormulario((estadoAtual) => ({
      ...estadoAtual,
      [campo]: decimal,
    }));
  }

  function atualizarFotos(evento) {
    setFotosSelecionadas(Array.from(evento.target.files || []));
  }

  function limparFormulario() {
    setFormulario(formularioInicial);
    setEditandoId(null);
    setFotosSelecionadas([]);
    setFotosAtuais([]);

    if (inputFotosRef.current) {
      inputFotosRef.current.value = "";
    }
  }

  async function enviarFotos(equipamentoId) {
    if (fotosSelecionadas.length === 0) {
      return;
    }

    const formData = new FormData();

    fotosSelecionadas.forEach((foto) => {
      formData.append("fotos", foto);
    });

    await apiRequest(`/equipamentos/${equipamentoId}/fotos/`, {
      method: "POST",
      body: formData,
    });
  }

  async function salvarEquipamento(evento) {
    evento.preventDefault();

    setSalvando(true);
    setAviso(null);

    const editando = Boolean(editandoId);

    const endpoint = editando
      ? `/equipamentos/${editandoId}/`
      : "/equipamentos/";

    const metodo = editando ? "PUT" : "POST";

    try {
      const dados = await apiRequest(endpoint, {
        method: metodo,
        body: JSON.stringify(formulario),
      });

      const equipamentoId = dados.equipamento?.id || editandoId;

      if (equipamentoId) {
        await enviarFotos(equipamentoId);
      }

      setAviso({
        tipo: "sucesso",
        titulo: editando ? "Equipamento atualizado" : "Equipamento cadastrado",
        texto: fotosSelecionadas.length > 0
          ? `${dados.mensagem} Foto(s) anexada(s) com sucesso.`
          : dados.mensagem,
      });

      limparFormulario();
      setBusca("");
      await carregarEquipamentos("");
    } catch (erro) {
      if (erro.status === 409) {
        setAviso({
          tipo: "duplicado",
          titulo: "Equipamento duplicado encontrado",
          texto: erro.dados?.erro || "Já existe equipamento usando esse patrimônio ou número de série.",
          duplicados: erro.dados?.duplicados || [],
        });

        return;
      }

      setAviso({
        tipo: "erro",
        titulo: "Não foi possível salvar",
        texto: erro.message,
      });
    } finally {
      setSalvando(false);
    }
  }

  function editarEquipamento(equipamento) {
    setEditandoId(equipamento.id);

    setFormulario({
      tipo: equipamento.tipo || "desktop",
      patrimonio: equipamento.patrimonio || "",
      marca: equipamento.marca || "",
      modelo: equipamento.modelo || "",
      numero_serie: equipamento.numero_serie || "",
      setor_id: equipamento.setor?.id || "",
      usuario_responsavel: equipamento.usuario_responsavel || "",
      status: equipamento.status || "em_uso",
      produto_novo: Boolean(equipamento.produto_novo),
      data_compra: equipamento.data_compra || "",
      fornecedor: equipamento.fornecedor || "",
      numero_nota_fiscal: equipamento.numero_nota_fiscal || "",
      valor_compra: equipamento.valor_compra || "",
      garantia_ate: equipamento.garantia_ate || "",
      origem: equipamento.origem || "",
      observacoes: equipamento.observacoes || "",
    });

    setFotosAtuais(equipamento.fotos || []);
    setFotosSelecionadas([]);

    if (inputFotosRef.current) {
      inputFotosRef.current.value = "";
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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

      setFotosAtuais((listaAtual) => listaAtual.filter((item) => item.id !== foto.id));
      await carregarEquipamentos();
    } catch (erro) {
      setAviso({
        tipo: "erro",
        titulo: "Erro ao remover foto",
        texto: erro.message,
      });
    }
  }

  async function excluirEquipamento(equipamento) {
    const descricao = [
      equipamento.tipo_display,
      equipamento.marca,
      equipamento.modelo,
      equipamento.patrimonio ? `Patrimônio ${equipamento.patrimonio}` : "",
    ].filter(Boolean).join(" - ");

    const confirmar = window.confirm(
      `Deseja realmente remover este equipamento?\n\n${descricao}`
    );

    if (!confirmar) {
      return;
    }

    try {
      const dados = await apiRequest(`/equipamentos/${equipamento.id}/`, {
        method: "DELETE",
      });

      setAviso({
        tipo: "sucesso",
        titulo: "Equipamento removido",
        texto: dados.mensagem,
      });

      await carregarEquipamentos();
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
              {editandoId ? "Editar equipamento" : "Novo equipamento"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Informe patrimônio, identificação, setor, compra e fotos.
            </p>
          </div>

          <form onSubmit={salvarEquipamento} className="space-y-4 p-4 sm:p-5">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Tipo do equipamento
              </label>

              <select
                name="tipo"
                value={formulario.tipo}
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Patrimônio
                </label>

                <input
                  type="text"
                  name="patrimonio"
                  value={formulario.patrimonio}
                  onChange={atualizarCampo}
                  placeholder="Ex: TI-0001"
                  className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Número de série
                </label>

                <input
                  type="text"
                  name="numero_serie"
                  value={formulario.numero_serie}
                  onChange={atualizarCampo}
                  placeholder="Ex: SN123456"
                  className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Marca
                </label>

                <input
                  type="text"
                  name="marca"
                  value={formulario.marca}
                  onChange={atualizarCampo}
                  placeholder="Ex: Dell"
                  className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Modelo
                </label>

                <input
                  type="text"
                  name="modelo"
                  value={formulario.modelo}
                  onChange={atualizarCampo}
                  placeholder="Ex: OptiPlex 3080"
                  className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Setor
              </label>

              <select
                name="setor_id"
                value={formulario.setor_id}
                onChange={atualizarCampo}
                className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
              >
                <option value="">Sem setor definido</option>

                {setores.map((setor) => (
                  <option key={setor.id} value={setor.id}>
                    {setor.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Usuário responsável
              </label>

              <input
                type="text"
                name="usuario_responsavel"
                value={formulario.usuario_responsavel}
                onChange={atualizarCampo}
                placeholder="Ex: João Silva"
                className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
              />
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

            <div className="border border-slate-200 bg-slate-50 p-4">
              <label className="flex items-center gap-3 text-sm font-bold text-slate-800">
                <input
                  type="checkbox"
                  name="produto_novo"
                  checked={formulario.produto_novo}
                  onChange={atualizarCampo}
                  className="h-5 w-5 sm:h-4 sm:w-4"
                />
                Produto novo
              </label>

              <p className="mt-1 text-xs text-slate-500">
                Marque quando o item entrou como compra, doação, transferência ou reaproveitamento.
              </p>
            </div>

            {formulario.produto_novo && (
              <div className="space-y-4 border border-slate-200 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      Data de compra
                    </label>

                    <input
                      type="date"
                      name="data_compra"
                      value={formulario.data_compra}
                      onChange={atualizarCampo}
                      className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      Garantia até
                    </label>

                    <input
                      type="date"
                      name="garantia_ate"
                      value={formulario.garantia_ate}
                      onChange={atualizarCampo}
                      className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Fornecedor
                  </label>

                  <input
                    type="text"
                    name="fornecedor"
                    value={formulario.fornecedor}
                    onChange={atualizarCampo}
                    placeholder="Ex: Magazine, Amazon, fornecedor local..."
                    className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      Número da nota fiscal
                    </label>

                    <input
                      type="text"
                      name="numero_nota_fiscal"
                      value={formulario.numero_nota_fiscal}
                      onChange={atualizarCampo}
                      placeholder="Ex: NF-12345"
                      className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      Valor de compra
                    </label>

                    <input
                      type="text"
                      inputMode="numeric"
                      name="valor_compra"
                      value={formatarMoeda(formulario.valor_compra)}
                      onChange={(evento) => atualizarCampoMoeda(evento, "valor_compra")}
                      placeholder="R$ 0,00"
                      className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
                    />

                    <p className="mt-1 text-xs text-slate-500">
                      Digite apenas os números. Ex: 350000 vira R$ 3.500,00.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Origem
                  </label>

                  <select
                    name="origem"
                    value={formulario.origem}
                    onChange={atualizarCampo}
                    className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
                  >
                    <option value="">Selecione a origem</option>

                    {origens.map((origem) => (
                      <option key={origem.value} value={origem.value}>
                        {origem.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Fotos do equipamento
              </label>

              <input
                ref={inputFotosRef}
                type="file"
                accept="image/*"
                multiple
                onChange={atualizarFotos}
                className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
              />

              <p className="mt-1 text-xs text-slate-500">
                Você pode anexar uma ou mais fotos do equipamento.
              </p>

              {fotosSelecionadas.length > 0 && (
                <p className="mt-2 text-xs font-semibold text-slate-700">
                  {fotosSelecionadas.length} foto(s) selecionada(s).
                </p>
              )}
            </div>

            {fotosAtuais.length > 0 && (
              <div className="border border-slate-200 p-3">
                <p className="mb-3 text-sm font-bold text-slate-800">
                  Fotos atuais
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {fotosAtuais.map((foto) => (
                    <div key={foto.id} className="border border-slate-200 bg-white p-2">
                      <a href={foto.url} target="_blank" rel="noreferrer">
                        <img
                          src={foto.url}
                          alt="Foto do equipamento"
                          className="h-28 w-full object-cover"
                        />
                      </a>

                      <button
                        type="button"
                        onClick={() => excluirFoto(foto)}
                        className="mt-2 w-full border border-red-200 px-2 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Observações
              </label>

              <textarea
                name="observacoes"
                value={formulario.observacoes}
                onChange={atualizarCampo}
                placeholder="Ex: equipamento novo, em manutenção, sem carregador..."
                rows={4}
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
                    ? "Atualizar equipamento"
                    : "Cadastrar equipamento"}
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
                Equipamentos cadastrados
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Total encontrado: {equipamentos.length}
              </p>
            </div>

            <input
              type="text"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar por patrimônio, marca, setor..."
              className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 lg:max-w-xs lg:py-2.5"
            />
          </div>

          <div className="p-4 lg:hidden">
            {carregando && (
              <div className="border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
                Carregando equipamentos...
              </div>
            )}

            {!carregando && equipamentos.length === 0 && (
              <div className="border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
                Nenhum equipamento cadastrado ainda.
              </div>
            )}

            {!carregando && equipamentos.length > 0 && (
              <div className="space-y-4">
                {equipamentos.map((equipamento) => (
                  <EquipamentoCardMobile
                    key={equipamento.id}
                    equipamento={equipamento}
                    aoVerDetalhes={aoVerDetalhes}
                    aoEditar={editarEquipamento}
                    aoExcluir={excluirEquipamento}
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
                  <th className="px-5 py-3">Patrimônio</th>
                  <th className="px-5 py-3">Série</th>
                  <th className="px-5 py-3">Setor</th>
                  <th className="px-5 py-3">Responsável</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Fotos</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>

              <tbody>
                {carregando && (
                  <tr>
                    <td colSpan="8" className="px-5 py-8 text-center text-slate-500">
                      Carregando equipamentos...
                    </td>
                  </tr>
                )}

                {!carregando && equipamentos.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-5 py-8 text-center text-slate-500">
                      Nenhum equipamento cadastrado ainda.
                    </td>
                  </tr>
                )}

                {!carregando && equipamentos.map((equipamento) => (
                  <tr key={equipamento.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-950">
                        {equipamento.tipo_display}
                        {equipamento.produto_novo && (
                          <span className="ml-2 border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-bold text-sky-800">
                            Novo
                          </span>
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {descricaoEquipamento(equipamento)}
                      </p>

                      {equipamento.produto_novo && (
                        <p className="mt-1 text-xs text-slate-500">
                          {equipamento.origem_display || "Origem não informada"}
                          {equipamento.valor_compra ? ` · ${formatarMoeda(equipamento.valor_compra)}` : ""}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4 font-mono text-slate-700">
                      {equipamento.patrimonio || "-"}
                    </td>

                    <td className="px-5 py-4 font-mono text-slate-700">
                      {equipamento.numero_serie || "-"}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {equipamento.setor?.nome || "-"}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {equipamento.usuario_responsavel || "-"}
                    </td>

                    <td className="px-5 py-4">
                      <span className={`inline-flex border px-2 py-1 text-xs font-bold ${badgeStatus(equipamento.status)}`}>
                        {equipamento.status_display}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {equipamento.fotos?.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <a href={equipamento.fotos[0].url} target="_blank" rel="noreferrer">
                            <img
                              src={equipamento.fotos[0].url}
                              alt="Foto do equipamento"
                              className="h-10 w-10 border border-slate-200 object-cover"
                            />
                          </a>

                          <span className="text-xs font-bold text-slate-600">
                            {equipamento.fotos.length}
                          </span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => aoVerDetalhes?.(equipamento.id)}
                          className="border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700"
                        >
                          Ver detalhes
                        </button>

                        <button
                          type="button"
                          onClick={() => editarEquipamento(equipamento)}
                          className="border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => excluirEquipamento(equipamento)}
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