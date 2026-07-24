import { useEffect, useMemo, useState } from "react";
import {
  FiCpu,
  FiEdit2,
  FiHardDrive,
  FiMonitor,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiWifi,
  FiX,
} from "react-icons/fi";

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

const inputClasse = "w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5";

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
          {aviso.texto && <p className="mt-1 text-sm">{aviso.texto}</p>}
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
                  <td className="px-3 py-2">{item.nome_usuario}</td>
                  <td className="px-3 py-2">{item.setor?.nome || "-"}</td>
                  <td className="px-3 py-2 font-mono">{item.ip_computador}</td>
                  <td className="px-3 py-2 font-mono">{item.mac_address}</td>
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

function ResumoCard({ titulo, valor, descricao, icone: Icone }) {
  return (
    <div className="border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {titulo}
          </p>
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
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {titulo}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-800">
        {valor || "-"}
      </p>
    </div>
  );
}

function ComputadorCard({ computador, aoEditar, aoExcluir, podeEditar, podeExcluir }) {
  return (
    <article className="border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[56px_1fr_auto] lg:items-start">
        <div className="flex h-14 w-14 items-center justify-center border border-slate-200 text-slate-500">
          <FiMonitor size={25} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-base font-black text-slate-950 sm:text-lg">
              {computador.nome_usuario}
            </h3>

            <span className="border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700">
              {computador.setor?.nome || "Sem setor"}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <InfoCompacta titulo="IP" valor={computador.ip_computador} />
            <InfoCompacta titulo="MAC" valor={computador.mac_address} />
            <InfoCompacta titulo="Processador" valor={computador.processador} />
            <InfoCompacta titulo="Memória" valor={computador.memoria_ram} />
            <InfoCompacta titulo="Armazenamento" valor={textoEspecificacoes(computador)} />
          </div>

          {computador.observacoes && (
            <p className="mt-4 line-clamp-2 border-l-2 border-slate-200 pl-3 text-sm leading-6 text-slate-500">
              {computador.observacoes}
            </p>
          )}

          <p className="mt-3 text-xs text-slate-400">
            Atualizado em {computador.atualizado_em}
          </p>
        </div>

        {(podeEditar || podeExcluir) && (
          <div className="flex flex-col gap-2 lg:min-w-32">
            {podeEditar && (
              <button
                type="button"
                onClick={() => aoEditar(computador)}
                className="flex items-center justify-center gap-2 border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 lg:py-2.5"
              >
                <FiEdit2 size={16} />
                Editar
              </button>
            )}

            {podeExcluir && (
              <button
                type="button"
                onClick={() => aoExcluir(computador)}
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
      <label className="mb-1 block text-sm font-semibold text-slate-700">
        {label}
      </label>
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

export default function ComputadoresPage({ permissoes }) {
  const [computadores, setComputadores] = useState([]);
  const [setores, setSetores] = useState([]);
  const [armazenamentos, setArmazenamentos] = useState(armazenamentosPadrao);
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
    const total = computadores.length;
    const semSetor = computadores.filter((item) => !item.setor?.id).length;
    const comEspecificacoes = computadores.filter((item) => item.mostrar_especificacoes).length;
    const semEspecificacoes = total - comEspecificacoes;

    return { total, semSetor, comEspecificacoes, semEspecificacoes };
  }, [computadores]);

  async function carregarSetores() {
    try {
      const dados = await apiRequest("/setores/");
      setSetores(dados.resultados || []);
    } catch (erro) {
      setAviso({ tipo: "erro", titulo: "Erro ao carregar setores", texto: erro.message });
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
      setAviso({ tipo: "erro", titulo: "Erro ao carregar dados", texto: erro.message });
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

  function abrirNovoComputador() {
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

  async function salvarComputador(evento) {
    evento.preventDefault();

    setSalvando(true);
    setAviso(null);

    const editando = Boolean(editandoId);
    const endpoint = editando ? `/computadores/${editandoId}/` : "/computadores/";
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
      setModalCadastroAberto(false);
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

      setAviso({ tipo: "erro", titulo: "Não foi possível salvar", texto: erro.message });
    } finally {
      setSalvando(false);
    }
  }

  function editarComputador(computador) {
    setEditandoId(computador.id);
    setAviso(null);

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

    setModalCadastroAberto(true);
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

      setAviso({ tipo: "sucesso", titulo: "Cadastro removido", texto: dados.mensagem });
      await carregarComputadores();
    } catch (erro) {
      setAviso({ tipo: "erro", titulo: "Erro ao remover", texto: erro.message });
    }
  }

  return (
    <div className="mx-auto max-w-[1500px]">
      {!modalCadastroAberto && <Aviso aviso={aviso} onFechar={() => setAviso(null)} />}

      <div className="mb-5 flex flex-col gap-4 border border-slate-200 bg-white p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">
            Computadores cadastrados
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Visualização rápida de usuários, IP, MAC, setor e especificações.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:w-96">
            <FiSearch
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar por nome, setor, IP, MAC ou especificações..."
              className="w-full border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
            />
          </div>

          {podeEditar && (
            <button
              type="button"
              onClick={abrirNovoComputador}
              className="flex items-center justify-center gap-2 bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 sm:py-2.5"
            >
              <FiPlus size={17} />
              Novo computador
            </button>
          )}
        </div>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ResumoCard titulo="Total" valor={resumo.total} descricao="Computadores na lista" icone={FiMonitor} />
        <ResumoCard titulo="Com especificações" valor={resumo.comEspecificacoes} descricao="Cadastros detalhados" icone={FiCpu} />
        <ResumoCard titulo="Sem especificações" valor={resumo.semEspecificacoes} descricao="Cadastros simples" icone={FiHardDrive} />
        <ResumoCard titulo="Sem setor" valor={resumo.semSetor} descricao="Sem localização definida" icone={FiWifi} />
      </div>

      <section className="border border-slate-200 bg-white">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-black text-slate-950">
              Lista de computadores
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Total encontrado: {computadores.length}
            </p>
          </div>

          {carregando && <div className="text-sm font-semibold text-slate-500">Carregando...</div>}
        </div>

        <div className="space-y-4 bg-slate-50/60 p-4 sm:p-5">
          {carregando && computadores.length === 0 && (
            <div className="border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Carregando cadastros...
            </div>
          )}

          {!carregando && computadores.length === 0 && (
            <div className="border border-slate-200 bg-white p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center text-slate-400">
                <FiMonitor size={26} />
              </div>
              <p className="mt-4 text-sm font-bold text-slate-800">
                Nenhum computador encontrado.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Cadastre um novo item ou ajuste a busca para visualizar os registros.
              </p>
            </div>
          )}

          {computadores.map((computador) => (
            <ComputadorCard
              key={computador.id}
              computador={computador}
              aoEditar={editarComputador}
              aoExcluir={excluirComputador}
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
                      {editandoId ? "Editar computador" : "Novo computador"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Informe usuário, setor, rede e especificações do equipamento.
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

              <form onSubmit={salvarComputador} className="flex min-h-0 flex-1 flex-col">
                <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                  <Aviso aviso={aviso} onFechar={() => setAviso(null)} />

                  <div className="space-y-5 pb-8">
                    <SecaoFormulario titulo="Identificação" descricao="Dados principais do usuário e da rede.">
                      <div className="grid gap-4 md:grid-cols-2">
                        <Campo label="Nome do usuário">
                          <input
                            type="text"
                            name="nome_usuario"
                            value={formulario.nome_usuario}
                            onChange={atualizarCampo}
                            placeholder="Ex: João Silva"
                            className={inputClasse}
                          />
                        </Campo>

                        <Campo label="Setor">
                          <select
                            name="setor_id"
                            value={formulario.setor_id}
                            onChange={atualizarCampo}
                            className={inputClasse}
                          >
                            <option value="">Sem setor definido</option>
                            {setores.map((setor) => (
                              <option key={setor.id} value={setor.id}>{setor.nome}</option>
                            ))}
                          </select>
                        </Campo>

                        <Campo label="IP do computador">
                          <input
                            type="text"
                            name="ip_computador"
                            value={formulario.ip_computador}
                            onChange={atualizarCampo}
                            placeholder="Ex: 192.168.1.25"
                            className={inputClasse}
                          />
                        </Campo>

                        <Campo label="Endereço MAC">
                          <input
                            type="text"
                            name="mac_address"
                            value={formulario.mac_address}
                            onChange={atualizarCampo}
                            placeholder="Ex: AA:BB:CC:DD:EE:FF"
                            className="w-full border border-slate-300 bg-white px-3 py-3 text-sm uppercase outline-none focus:border-slate-950 sm:py-2.5"
                          />
                          <p className="mt-1 text-xs text-slate-500">
                            Pode digitar com dois pontos, traços ou tudo junto.
                          </p>
                        </Campo>
                      </div>
                    </SecaoFormulario>

                    <SecaoFormulario titulo="Especificações" descricao="Marque para preencher processador, memória, armazenamento e fonte.">
                      <label className="flex items-center gap-3 border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-800">
                        <input
                          type="checkbox"
                          name="mostrar_especificacoes"
                          checked={formulario.mostrar_especificacoes}
                          onChange={atualizarCampo}
                          className="h-5 w-5 sm:h-4 sm:w-4"
                        />
                        Informar especificações
                      </label>

                      {formulario.mostrar_especificacoes && (
                        <div className="grid gap-4 md:grid-cols-2">
                          <Campo label="Processador">
                            <input
                              type="text"
                              name="processador"
                              value={formulario.processador}
                              onChange={atualizarCampo}
                              placeholder="Ex: Intel Core i5-10400"
                              className={inputClasse}
                            />
                          </Campo>

                          <Campo label="Memória RAM">
                            <input
                              type="text"
                              name="memoria_ram"
                              value={formulario.memoria_ram}
                              onChange={atualizarCampo}
                              placeholder="Ex: 8 GB DDR4"
                              className={inputClasse}
                            />
                          </Campo>

                          <Campo label="Tipo de armazenamento">
                            <select
                              name="armazenamento_tipo"
                              value={formulario.armazenamento_tipo}
                              onChange={atualizarCampo}
                              className={inputClasse}
                            >
                              <option value="">Não informado</option>
                              {armazenamentos.map((item) => (
                                <option key={item.value} value={item.value}>{item.label}</option>
                              ))}
                            </select>
                          </Campo>

                          <Campo label="Capacidade">
                            <input
                              type="text"
                              name="armazenamento_capacidade"
                              value={formulario.armazenamento_capacidade}
                              onChange={atualizarCampo}
                              placeholder="Ex: 240 GB, 1 TB..."
                              className={inputClasse}
                            />
                          </Campo>

                          <Campo label="Fonte em watts">
                            <input
                              type="number"
                              min="1"
                              name="fonte_watts"
                              value={formulario.fonte_watts}
                              onChange={atualizarCampo}
                              placeholder="Ex: 500"
                              className={inputClasse}
                            />
                          </Campo>
                        </div>
                      )}
                    </SecaoFormulario>

                    <SecaoFormulario titulo="Observações">
                      <Campo label="Observações">
                        <textarea
                          name="observacoes"
                          value={formulario.observacoes}
                          onChange={atualizarCampo}
                          placeholder="Ex: computador do financeiro, notebook Dell, sala administrativa..."
                          rows={4}
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
                          ? "Atualizar computador"
                          : "Cadastrar computador"}
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
