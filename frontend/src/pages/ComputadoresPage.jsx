import { useEffect, useState } from "react";

import { apiRequest } from "../services/api";

const formularioInicial = {
  nome_usuario: "",
  setor_id: "",
  ip_computador: "",
  mac_address: "",
  mostrar_especificacoes: false,
  processador: "",
  memoria_ram: "",
  armazenamento_tipo: "",
  armazenamento_capacidade: "",
  fonte_watts: "",
  observacoes: "",
};

const armazenamentosPadrao = [
  { value: "ssd", label: "SSD" },
  { value: "hd", label: "HD" },
  { value: "ssd_hd", label: "SSD + HD" },
  { value: "nvme", label: "NVMe" },
  { value: "outro", label: "Outro" },
];

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

      {aviso.duplicados?.length > 0 && (
        <div className="mt-4 overflow-x-auto border border-amber-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-amber-100 text-xs uppercase tracking-wide text-amber-950">
              <tr>
                <th className="px-3 py-2">Conflito</th>
                <th className="px-3 py-2">Usuário</th>
                <th className="px-3 py-2">Setor</th>
                <th className="px-3 py-2">IP</th>
                <th className="px-3 py-2">MAC</th>
              </tr>
            </thead>

            <tbody>
              {aviso.duplicados.map((item) => (
                <tr key={item.id} className="border-t border-amber-100">
                  <td className="px-3 py-2 font-semibold">
                    {item.conflitos?.join(" / ")}
                  </td>

                  <td className="px-3 py-2">
                    {item.nome_usuario}
                  </td>

                  <td className="px-3 py-2">
                    {item.setor?.nome || "-"}
                  </td>

                  <td className="px-3 py-2 font-mono">
                    {item.ip_computador}
                  </td>

                  <td className="px-3 py-2 font-mono">
                    {item.mac_address}
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

function textoEspecificacoes(computador) {
  if (!computador.mostrar_especificacoes) {
    return "-";
  }

  const partes = [];

  if (computador.processador) {
    partes.push(computador.processador);
  }

  if (computador.memoria_ram) {
    partes.push(computador.memoria_ram);
  }

  if (computador.armazenamento_tipo_display || computador.armazenamento_capacidade) {
    partes.push(
      [computador.armazenamento_tipo_display, computador.armazenamento_capacidade]
        .filter(Boolean)
        .join(" ")
    );
  }

  if (computador.fonte_watts) {
    partes.push(`Fonte ${computador.fonte_watts}W`);
  }

  return partes.length > 0 ? partes.join(" · ") : "-";
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

function ComputadorCardMobile({ computador, aoEditar, aoExcluir }) {
  return (
    <div className="border border-slate-200 bg-white p-4">
      <div>
        <h3 className="break-words text-base font-bold text-slate-950">
          {computador.nome_usuario}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {computador.setor?.nome || "Sem setor definido"}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
        <CardInfo titulo="IP" valor={computador.ip_computador} />
        <CardInfo titulo="MAC" valor={computador.mac_address} />
      </div>

      <div className="mt-4 border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Especificações
        </p>

        <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-800">
          {textoEspecificacoes(computador)}
        </p>
      </div>

      {computador.observacoes && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Observações
          </p>

          <p className="mt-1 line-clamp-3 break-words text-sm leading-6 text-slate-700">
            {computador.observacoes}
          </p>
        </div>
      )}

      <p className="mt-4 text-xs text-slate-500">
        Atualizado em {computador.atualizado_em}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => aoEditar(computador)}
          className="border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
        >
          Editar
        </button>

        <button
          type="button"
          onClick={() => aoExcluir(computador)}
          className="border border-red-200 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-50"
        >
          Excluir
        </button>
      </div>
    </div>
  );
}

export default function ComputadoresPage() {
  const [computadores, setComputadores] = useState([]);
  const [setores, setSetores] = useState([]);
  const [armazenamentos, setArmazenamentos] = useState(armazenamentosPadrao);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [editandoId, setEditandoId] = useState(null);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState(null);

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

  async function carregarComputadores(termoBusca = busca) {
    setCarregando(true);

    try {
      const query = termoBusca.trim()
        ? `?q=${encodeURIComponent(termoBusca.trim())}`
        : "";

      const dados = await apiRequest(`/computadores/${query}`);

      setComputadores(dados.resultados || []);
      setArmazenamentos(dados.opcoes?.armazenamentos || armazenamentosPadrao);
    } catch (erro) {
      setAviso({
        tipo: "erro",
        titulo: "Erro ao carregar dados",
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
      carregarComputadores(busca);
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

      if (name === "mostrar_especificacoes" && !checked) {
        novoEstado.processador = "";
        novoEstado.memoria_ram = "";
        novoEstado.armazenamento_tipo = "";
        novoEstado.armazenamento_capacidade = "";
        novoEstado.fonte_watts = "";
      }

      return novoEstado;
    });
  }

  function limparFormulario() {
    setFormulario(formularioInicial);
    setEditandoId(null);
  }

  async function salvarComputador(evento) {
    evento.preventDefault();

    setSalvando(true);
    setAviso(null);

    const editando = Boolean(editandoId);

    const endpoint = editando
      ? `/computadores/${editandoId}/`
      : "/computadores/";

    const metodo = editando ? "PUT" : "POST";

    try {
      const dados = await apiRequest(endpoint, {
        method: metodo,
        body: JSON.stringify(formulario),
      });

      setAviso({
        tipo: "sucesso",
        titulo: editando ? "Cadastro atualizado" : "Cadastro realizado",
        texto: dados.mensagem,
      });

      limparFormulario();
      setBusca("");
      await carregarComputadores("");
    } catch (erro) {
      if (erro.status === 409) {
        setAviso({
          tipo: "duplicado",
          titulo: "Cadastro duplicado encontrado",
          texto: erro.dados?.erro || "Já existe cadastro usando esse IP ou MAC.",
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

  function editarComputador(computador) {
    setEditandoId(computador.id);

    setFormulario({
      nome_usuario: computador.nome_usuario,
      setor_id: computador.setor?.id || "",
      ip_computador: computador.ip_computador,
      mac_address: computador.mac_address,
      mostrar_especificacoes: Boolean(computador.mostrar_especificacoes),
      processador: computador.processador || "",
      memoria_ram: computador.memoria_ram || "",
      armazenamento_tipo: computador.armazenamento_tipo || "",
      armazenamento_capacidade: computador.armazenamento_capacidade || "",
      fonte_watts: computador.fonte_watts || "",
      observacoes: computador.observacoes || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function excluirComputador(computador) {
    const confirmar = window.confirm(
      `Deseja realmente remover o cadastro de ${computador.nome_usuario}?`
    );

    if (!confirmar) {
      return;
    }

    try {
      const dados = await apiRequest(`/computadores/${computador.id}/`, {
        method: "DELETE",
      });

      setAviso({
        tipo: "sucesso",
        titulo: "Cadastro removido",
        texto: dados.mensagem,
      });

      await carregarComputadores();
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

      <section className="grid gap-6 xl:grid-cols-[440px_1fr]">
        <div className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
            <h2 className="text-base font-bold text-slate-950">
              {editandoId ? "Editar cadastro" : "Novo cadastro"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Informe o usuário responsável, setor, rede e especificações.
            </p>
          </div>

          <form onSubmit={salvarComputador} className="space-y-4 p-4 sm:p-5">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Nome do usuário
              </label>

              <input
                type="text"
                name="nome_usuario"
                value={formulario.nome_usuario}
                onChange={atualizarCampo}
                placeholder="Ex: João Silva"
                className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
              />
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

              {setores.length === 0 && (
                <p className="mt-1 text-xs text-amber-700">
                  Nenhum setor cadastrado ainda. Cadastre em Setores no menu lateral.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                IP do computador
              </label>

              <input
                type="text"
                name="ip_computador"
                value={formulario.ip_computador}
                onChange={atualizarCampo}
                placeholder="Ex: 192.168.1.25"
                className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Endereço MAC
              </label>

              <input
                type="text"
                name="mac_address"
                value={formulario.mac_address}
                onChange={atualizarCampo}
                placeholder="Ex: AA:BB:CC:DD:EE:FF"
                className="w-full border border-slate-300 bg-white px-3 py-3 text-sm uppercase outline-none focus:border-slate-950 sm:py-2.5"
              />

              <p className="mt-1 text-xs text-slate-500">
                Pode digitar com dois pontos, traços ou tudo junto. O sistema padroniza sozinho.
              </p>
            </div>

            <div className="border border-slate-200 bg-slate-50 p-4">
              <label className="flex items-center gap-3 text-sm font-bold text-slate-800">
                <input
                  type="checkbox"
                  name="mostrar_especificacoes"
                  checked={formulario.mostrar_especificacoes}
                  onChange={atualizarCampo}
                  className="h-5 w-5 sm:h-4 sm:w-4"
                />
                Especificações
              </label>

              <p className="mt-1 text-xs text-slate-500">
                Marque para informar processador, memória, armazenamento e fonte.
              </p>
            </div>

            {formulario.mostrar_especificacoes && (
              <div className="space-y-4 border border-slate-200 p-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Processador
                  </label>

                  <input
                    type="text"
                    name="processador"
                    value={formulario.processador}
                    onChange={atualizarCampo}
                    placeholder="Ex: Intel Core i5-10400"
                    className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Memória RAM
                  </label>

                  <input
                    type="text"
                    name="memoria_ram"
                    value={formulario.memoria_ram}
                    onChange={atualizarCampo}
                    placeholder="Ex: 8 GB DDR4"
                    className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      Tipo de armazenamento
                    </label>

                    <select
                      name="armazenamento_tipo"
                      value={formulario.armazenamento_tipo}
                      onChange={atualizarCampo}
                      className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
                    >
                      <option value="">Não informado</option>

                      {armazenamentos.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      Capacidade
                    </label>

                    <input
                      type="text"
                      name="armazenamento_capacidade"
                      value={formulario.armazenamento_capacidade}
                      onChange={atualizarCampo}
                      placeholder="Ex: 240 GB, 1 TB..."
                      className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Fonte em watts
                  </label>

                  <input
                    type="number"
                    min="1"
                    name="fonte_watts"
                    value={formulario.fonte_watts}
                    onChange={atualizarCampo}
                    placeholder="Ex: 500"
                    className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
                  />

                  <p className="mt-1 text-xs text-slate-500">
                    Informe somente o número. Ex: 500 para fonte de 500W.
                  </p>
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
                placeholder="Ex: computador do financeiro, notebook Dell, sala administrativa..."
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
                    ? "Atualizar cadastro"
                    : "Cadastrar computador"}
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
                Computadores cadastrados
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Total encontrado: {computadores.length}
              </p>
            </div>

            <input
              type="text"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar por nome, setor, IP, MAC ou especificações..."
              className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 lg:max-w-xs lg:py-2.5"
            />
          </div>

          <div className="p-4 lg:hidden">
            {carregando && (
              <div className="border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
                Carregando cadastros...
              </div>
            )}

            {!carregando && computadores.length === 0 && (
              <div className="border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
                Nenhum computador cadastrado ainda.
              </div>
            )}

            {!carregando && computadores.length > 0 && (
              <div className="space-y-4">
                {computadores.map((computador) => (
                  <ComputadorCardMobile
                    key={computador.id}
                    computador={computador}
                    aoEditar={editarComputador}
                    aoExcluir={excluirComputador}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Usuário</th>
                  <th className="px-5 py-3">Setor</th>
                  <th className="px-5 py-3">Especificações</th>
                  <th className="px-5 py-3">IP</th>
                  <th className="px-5 py-3">MAC</th>
                  <th className="px-5 py-3">Observações</th>
                  <th className="px-5 py-3">Atualizado</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>

              <tbody>
                {carregando && (
                  <tr>
                    <td colSpan="8" className="px-5 py-8 text-center text-slate-500">
                      Carregando cadastros...
                    </td>
                  </tr>
                )}

                {!carregando && computadores.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-5 py-8 text-center text-slate-500">
                      Nenhum computador cadastrado ainda.
                    </td>
                  </tr>
                )}

                {!carregando && computadores.map((computador) => (
                  <tr key={computador.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-950">
                      {computador.nome_usuario}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {computador.setor?.nome || "-"}
                    </td>

                    <td className="max-w-xs px-5 py-4 text-slate-600">
                      {textoEspecificacoes(computador)}
                    </td>

                    <td className="px-5 py-4 font-mono text-slate-700">
                      {computador.ip_computador}
                    </td>

                    <td className="px-5 py-4 font-mono text-slate-700">
                      {computador.mac_address}
                    </td>

                    <td className="max-w-xs px-5 py-4 text-slate-600">
                      {computador.observacoes || "-"}
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      {computador.atualizado_em}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => editarComputador(computador)}
                          className="border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => excluirComputador(computador)}
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