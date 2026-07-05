import { useEffect, useState } from "react";

import { apiRequest } from "../services/api";

const formularioInicial = {
  username: "",
  nome: "",
  email: "",
  password: "",
  perfil: "consulta",
  is_active: true,
};

const perfisPadrao = [
  { value: "admin", label: "Administrador" },
  { value: "tecnico", label: "Técnico T.I." },
  { value: "consulta", label: "Consulta" },
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
    </div>
  );
}

function badgePerfil(perfil) {
  if (perfil === "admin") {
    return "border-slate-900 bg-slate-900 text-white";
  }

  if (perfil === "tecnico") {
    return "border-sky-200 bg-sky-50 text-sky-800";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

function UsuarioCardMobile({ usuario, aoEditar, aoExcluir }) {
  return (
    <div className="border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="break-words text-base font-bold text-slate-950">
            {usuario.nome}
          </h3>

          <p className="mt-1 break-words text-sm text-slate-500">
            Login: {usuario.username}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex border px-2 py-1 text-xs font-bold ${badgePerfil(usuario.perfil)}`}>
            {usuario.perfil_display}
          </span>

          <span className={`inline-flex border px-2 py-1 text-xs font-bold ${usuario.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
            {usuario.is_active ? "Ativo" : "Inativo"}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            E-mail
          </p>
          <p className="mt-1 break-words font-semibold text-slate-800">
            {usuario.email || "-"}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Último login
          </p>
          <p className="mt-1 font-semibold text-slate-800">
            {usuario.ultimo_login}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => aoEditar(usuario)}
          className="border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
        >
          Editar
        </button>

        <button
          type="button"
          onClick={() => aoExcluir(usuario)}
          className="border border-red-200 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-50"
        >
          Excluir
        </button>
      </div>
    </div>
  );
}

export default function UsuariosPage({ usuarioLogado }) {
  const [usuarios, setUsuarios] = useState([]);
  const [perfis, setPerfis] = useState(perfisPadrao);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [editandoId, setEditandoId] = useState(null);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState(null);

  async function carregarUsuarios(termoBusca = busca) {
    setCarregando(true);

    try {
      const query = termoBusca.trim()
        ? `?q=${encodeURIComponent(termoBusca.trim())}`
        : "";

      const dados = await apiRequest(`/auth/usuarios/${query}`);

      setUsuarios(dados.resultados || []);
      setPerfis(dados.opcoes?.perfis || perfisPadrao);
    } catch (erro) {
      setAviso({
        tipo: "erro",
        titulo: "Erro ao carregar usuários",
        texto: erro.message,
      });
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    const temporizador = setTimeout(() => {
      carregarUsuarios(busca);
    }, 250);

    return () => clearTimeout(temporizador);
  }, [busca]);

  function atualizarCampo(evento) {
    const { name, value, type, checked } = evento.target;

    setFormulario((estadoAtual) => ({
      ...estadoAtual,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function limparFormulario() {
    setFormulario(formularioInicial);
    setEditandoId(null);
  }

  async function salvarUsuario(evento) {
    evento.preventDefault();

    setSalvando(true);
    setAviso(null);

    const editando = Boolean(editandoId);

    const endpoint = editando
      ? `/auth/usuarios/${editandoId}/`
      : "/auth/usuarios/";

    const metodo = editando ? "PUT" : "POST";

    try {
      const dados = await apiRequest(endpoint, {
        method: metodo,
        body: JSON.stringify(formulario),
      });

      setAviso({
        tipo: "sucesso",
        titulo: editando ? "Usuário atualizado" : "Usuário cadastrado",
        texto: dados.mensagem,
      });

      limparFormulario();
      setBusca("");
      await carregarUsuarios("");
    } catch (erro) {
      setAviso({
        tipo: "erro",
        titulo: "Não foi possível salvar usuário",
        texto: erro.message,
      });
    } finally {
      setSalvando(false);
    }
  }

  function editarUsuario(usuario) {
    setEditandoId(usuario.id);

    setFormulario({
      username: usuario.username || "",
      nome: usuario.nome || "",
      email: usuario.email || "",
      password: "",
      perfil: usuario.perfil || "consulta",
      is_active: Boolean(usuario.is_active),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function excluirUsuario(usuario) {
    if (usuario.id === usuarioLogado?.id) {
      setAviso({
        tipo: "erro",
        titulo: "Ação bloqueada",
        texto: "Você não pode excluir o próprio usuário logado.",
      });
      return;
    }

    const confirmar = window.confirm(
      `Deseja realmente remover o usuário ${usuario.username}?`
    );

    if (!confirmar) {
      return;
    }

    try {
      const dados = await apiRequest(`/auth/usuarios/${usuario.id}/`, {
        method: "DELETE",
      });

      setAviso({
        tipo: "sucesso",
        titulo: "Usuário removido",
        texto: dados.mensagem,
      });

      await carregarUsuarios();
    } catch (erro) {
      setAviso({
        tipo: "erro",
        titulo: "Erro ao remover usuário",
        texto: erro.message,
      });
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <Aviso aviso={aviso} onFechar={() => setAviso(null)} />

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
            <h2 className="text-base font-bold text-slate-950">
              {editandoId ? "Editar usuário" : "Novo usuário"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Controle quem acessa o sistema e qual permissão cada pessoa possui.
            </p>
          </div>

          <form onSubmit={salvarUsuario} className="space-y-4 p-4 sm:p-5">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Login
              </label>

              <input
                type="text"
                name="username"
                value={formulario.username}
                onChange={atualizarCampo}
                placeholder="Ex: joao.ti"
                className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Nome
              </label>

              <input
                type="text"
                name="nome"
                value={formulario.nome}
                onChange={atualizarCampo}
                placeholder="Ex: João Silva"
                className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                E-mail
              </label>

              <input
                type="email"
                name="email"
                value={formulario.email}
                onChange={atualizarCampo}
                placeholder="Ex: joao@empresa.com"
                className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Senha {editandoId ? "nova" : "inicial"}
              </label>

              <input
                type="password"
                name="password"
                value={formulario.password}
                onChange={atualizarCampo}
                placeholder={editandoId ? "Deixe vazio para manter a senha atual" : "Digite uma senha inicial"}
                className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Perfil
              </label>

              <select
                name="perfil"
                value={formulario.perfil}
                onChange={atualizarCampo}
                className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
              >
                {perfis.map((perfil) => (
                  <option key={perfil.value} value={perfil.value}>
                    {perfil.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="border border-slate-200 bg-slate-50 p-4">
              <label className="flex items-center gap-3 text-sm font-bold text-slate-800">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formulario.is_active}
                  onChange={atualizarCampo}
                  className="h-5 w-5 sm:h-4 sm:w-4"
                />
                Usuário ativo
              </label>
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
                    ? "Atualizar usuário"
                    : "Cadastrar usuário"}
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
                Usuários cadastrados
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Total encontrado: {usuarios.length}
              </p>
            </div>

            <input
              type="text"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar por login..."
              className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 lg:max-w-xs lg:py-2.5"
            />
          </div>

          <div className="p-4 lg:hidden">
            {carregando && (
              <div className="border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
                Carregando usuários...
              </div>
            )}

            {!carregando && usuarios.length === 0 && (
              <div className="border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
                Nenhum usuário cadastrado ainda.
              </div>
            )}

            {!carregando && usuarios.length > 0 && (
              <div className="space-y-4">
                {usuarios.map((usuario) => (
                  <UsuarioCardMobile
                    key={usuario.id}
                    usuario={usuario}
                    aoEditar={editarUsuario}
                    aoExcluir={excluirUsuario}
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
                  <th className="px-5 py-3">E-mail</th>
                  <th className="px-5 py-3">Perfil</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Último login</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>

              <tbody>
                {carregando && (
                  <tr>
                    <td colSpan="6" className="px-5 py-8 text-center text-slate-500">
                      Carregando usuários...
                    </td>
                  </tr>
                )}

                {!carregando && usuarios.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-5 py-8 text-center text-slate-500">
                      Nenhum usuário cadastrado ainda.
                    </td>
                  </tr>
                )}

                {!carregando && usuarios.map((usuario) => (
                  <tr key={usuario.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-950">
                        {usuario.nome}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {usuario.username}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {usuario.email || "-"}
                    </td>

                    <td className="px-5 py-4">
                      <span className={`inline-flex border px-2 py-1 text-xs font-bold ${badgePerfil(usuario.perfil)}`}>
                        {usuario.perfil_display}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {usuario.is_active ? "Ativo" : "Inativo"}
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      {usuario.ultimo_login}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => editarUsuario(usuario)}
                          className="border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => excluirUsuario(usuario)}
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