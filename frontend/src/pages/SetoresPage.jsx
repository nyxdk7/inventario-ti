import { useEffect, useMemo, useState } from "react";
import {
  FiEdit2,
  FiEye,
  FiMapPin,
  FiMonitor,
  FiPackage,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiUsers,
  FiX,
} from "react-icons/fi";

import { apiRequest } from "../services/api";

const formularioInicial = {
  nome: "",
  responsavel: "",
  observacoes: "",
};

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

      {aviso.setor && (
        <div className="mt-4 border border-amber-200 bg-white p-3 text-sm">
          <p><span className="font-bold">Setor existente:</span> {aviso.setor.nome}</p>
          <p className="mt-1"><span className="font-bold">Responsável:</span> {aviso.setor.responsavel || "-"}</p>
        </div>
      )}
    </div>
  );
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

function SetorCard({ setor, aoVerDetalhes, aoEditar, aoExcluir, podeEditar, podeExcluir }) {
  return (
    <article className="border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[56px_1fr_auto] lg:items-start">
        <div className="flex h-14 w-14 items-center justify-center border border-slate-200 text-slate-500">
          <FiMapPin size={25} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-base font-black text-slate-950 sm:text-lg">
              {setor.nome}
            </h3>

            <span className="border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700">
              {setor.responsavel || "Sem responsável"}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InfoCompacta titulo="Computadores" valor={setor.total_computadores} />
            <InfoCompacta titulo="Equipamentos" valor={setor.total_equipamentos} />
            <InfoCompacta titulo="Criado em" valor={setor.criado_em} />
            <InfoCompacta titulo="Atualizado" valor={setor.atualizado_em} />
          </div>

          {setor.observacoes && (
            <p className="mt-4 line-clamp-2 border-l-2 border-slate-200 pl-3 text-sm leading-6 text-slate-500">
              {setor.observacoes}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 lg:min-w-36">
          <button
            type="button"
            onClick={() => aoVerDetalhes?.(setor.id)}
            className="flex items-center justify-center gap-2 border border-slate-950 bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 lg:py-2.5"
          >
            <FiEye size={16} />
            Ver detalhes
          </button>

          {podeEditar && (
            <button
              type="button"
              onClick={() => aoEditar(setor)}
              className="flex items-center justify-center gap-2 border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 lg:py-2.5"
            >
              <FiEdit2 size={16} />
              Editar
            </button>
          )}

          {podeExcluir && (
            <button
              type="button"
              onClick={() => aoExcluir(setor)}
              className="flex items-center justify-center gap-2 border border-red-200 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-50 lg:py-2.5"
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

export default function SetoresPage({ aoVerDetalhes, permissoes }) {
  const [setores, setSetores] = useState([]);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [editandoId, setEditandoId] = useState(null);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);

  const podeEditar = permissoes?.podeGerenciarSetores ?? true;
  const podeExcluir = permissoes?.podeExcluir ?? true;

  const resumo = useMemo(() => {
    const total = setores.length;
    const computadores = setores.reduce((soma, setor) => soma + Number(setor.total_computadores || 0), 0);
    const equipamentos = setores.reduce((soma, setor) => soma + Number(setor.total_equipamentos || 0), 0);
    const semResponsavel = setores.filter((setor) => !setor.responsavel).length;

    return { total, computadores, equipamentos, semResponsavel };
  }, [setores]);

  async function carregarSetores(termoBusca = busca) {
    setCarregando(true);

    try {
      const query = termoBusca.trim()
        ? `?q=${encodeURIComponent(termoBusca.trim())}`
        : "";

      const dados = await apiRequest(`/setores/${query}`);
      setSetores(dados.resultados || []);
    } catch (erro) {
      setAviso({ tipo: "erro", titulo: "Erro ao carregar setores", texto: erro.message });
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    const temporizador = setTimeout(() => {
      carregarSetores(busca);
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

  function limparFormulario() {
    setFormulario(formularioInicial);
    setEditandoId(null);
  }

  function abrirNovoSetor() {
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

  async function salvarSetor(evento) {
    evento.preventDefault();

    setSalvando(true);
    setAviso(null);

    const editando = Boolean(editandoId);
    const endpoint = editando ? `/setores/${editandoId}/` : "/setores/";
    const metodo = editando ? "PUT" : "POST";

    try {
      const dados = await apiRequest(endpoint, {
        method: metodo,
        body: JSON.stringify(formulario),
      });

      setAviso({
        tipo: "sucesso",
        titulo: editando ? "Setor atualizado" : "Setor cadastrado",
        texto: dados.mensagem,
      });

      limparFormulario();
      setModalCadastroAberto(false);
      setBusca("");
      await carregarSetores("");
    } catch (erro) {
      if (erro.status === 409) {
        setAviso({
          tipo: "duplicado",
          titulo: "Setor duplicado encontrado",
          texto: erro.dados?.erro || "Já existe um setor cadastrado com esse nome.",
          setor: erro.dados?.setor || null,
        });
        return;
      }

      setAviso({ tipo: "erro", titulo: "Não foi possível salvar", texto: erro.message });
    } finally {
      setSalvando(false);
    }
  }

  function editarSetor(setor) {
    setEditandoId(setor.id);
    setAviso(null);

    setFormulario({
      nome: setor.nome || "",
      responsavel: setor.responsavel || "",
      observacoes: setor.observacoes || "",
    });

    setModalCadastroAberto(true);
  }

  async function excluirSetor(setor) {
    const confirmar = window.confirm(
      `Deseja realmente remover o setor ${setor.nome}?\n\nOs computadores e equipamentos desse setor não serão apagados, apenas ficarão sem setor definido.`
    );

    if (!confirmar) {
      return;
    }

    try {
      const dados = await apiRequest(`/setores/${setor.id}/`, {
        method: "DELETE",
      });

      setAviso({ tipo: "sucesso", titulo: "Setor removido", texto: dados.mensagem });
      await carregarSetores();
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
            Setores cadastrados
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Visualização rápida dos setores, responsáveis e vínculos do inventário.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:w-96">
            <FiSearch size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar por setor, responsável ou observação..."
              className="w-full border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
            />
          </div>

          {podeEditar && (
            <button
              type="button"
              onClick={abrirNovoSetor}
              className="flex items-center justify-center gap-2 bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 sm:py-2.5"
            >
              <FiPlus size={17} />
              Novo setor
            </button>
          )}
        </div>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ResumoCard titulo="Total" valor={resumo.total} descricao="Setores na lista" icone={FiMapPin} />
        <ResumoCard titulo="Computadores" valor={resumo.computadores} descricao="Vinculados aos setores" icone={FiMonitor} />
        <ResumoCard titulo="Equipamentos" valor={resumo.equipamentos} descricao="Patrimônios vinculados" icone={FiPackage} />
        <ResumoCard titulo="Sem responsável" valor={resumo.semResponsavel} descricao="Setores sem responsável" icone={FiUsers} />
      </div>

      <section className="border border-slate-200 bg-white">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-black text-slate-950">Lista de setores</h3>
            <p className="mt-1 text-sm text-slate-500">Total encontrado: {setores.length}</p>
          </div>
          {carregando && <div className="text-sm font-semibold text-slate-500">Carregando...</div>}
        </div>

        <div className="space-y-4 bg-slate-50/60 p-4 sm:p-5">
          {carregando && setores.length === 0 && (
            <div className="border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Carregando setores...</div>
          )}

          {!carregando && setores.length === 0 && (
            <div className="border border-slate-200 bg-white p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center text-slate-400">
                <FiMapPin size={26} />
              </div>
              <p className="mt-4 text-sm font-bold text-slate-800">Nenhum setor encontrado.</p>
              <p className="mt-1 text-sm text-slate-500">Cadastre um novo setor ou ajuste a busca.</p>
            </div>
          )}

          {setores.map((setor) => (
            <SetorCard
              key={setor.id}
              setor={setor}
              aoVerDetalhes={aoVerDetalhes}
              aoEditar={editarSetor}
              aoExcluir={excluirSetor}
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
            <div className="relative flex h-full w-full max-w-2xl flex-col bg-[#f4f5f7] shadow-2xl">
              <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-950">
                      {editandoId ? "Editar setor" : "Novo setor"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Cadastre setores, locais ou departamentos usados no inventário.
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

              <form onSubmit={salvarSetor} className="flex min-h-0 flex-1 flex-col">
                <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                  <Aviso aviso={aviso} onFechar={() => setAviso(null)} />

                  <div className="space-y-5 pb-8">
                    <section className="border border-slate-200 bg-white">
                      <div className="border-b border-slate-200 px-4 py-4">
                        <h3 className="text-sm font-black text-slate-950">Dados do setor</h3>
                      </div>

                      <div className="space-y-4 p-4">
                        <Campo label="Nome do setor">
                          <input
                            type="text"
                            name="nome"
                            value={formulario.nome}
                            onChange={atualizarCampo}
                            placeholder="Ex: Administrativo"
                            className={inputClasse}
                          />
                        </Campo>

                        <Campo label="Responsável">
                          <input
                            type="text"
                            name="responsavel"
                            value={formulario.responsavel}
                            onChange={atualizarCampo}
                            placeholder="Ex: João Silva"
                            className={inputClasse}
                          />
                        </Campo>

                        <Campo label="Observações">
                          <textarea
                            name="observacoes"
                            value={formulario.observacoes}
                            onChange={atualizarCampo}
                            placeholder="Ex: sala administrativa, setor financeiro, almoxarifado..."
                            rows={5}
                            className="w-full resize-none border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
                          />
                        </Campo>
                      </div>
                    </section>
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
                          ? "Atualizar setor"
                          : "Cadastrar setor"}
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
