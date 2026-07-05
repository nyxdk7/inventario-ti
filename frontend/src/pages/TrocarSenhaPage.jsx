import { useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiCpu,
  FiEye,
  FiEyeOff,
  FiLock,
  FiLogOut,
} from "react-icons/fi";

import { apiRequest } from "../services/api";

function CampoSenha({
  label,
  name,
  value,
  onChange,
  placeholder,
  mostrar,
  aoAlternarMostrar,
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <div className="flex items-center border border-slate-300 bg-white transition-colors focus-within:border-slate-950">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center text-slate-400">
          <FiLock size={18} />
        </div>

        <input
          type={mostrar ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete="new-password"
          className="min-w-0 flex-1 bg-transparent px-0 py-3 text-sm font-semibold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400"
        />

        <div className="flex h-12 shrink-0 items-center justify-center px-2">
          <button
            type="button"
            onClick={aoAlternarMostrar}
            className="flex h-9 w-9 items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-950"
            title={mostrar ? "Ocultar senha" : "Mostrar senha"}
          >
            {mostrar ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TrocarSenhaPage({ usuario, aoSenhaAlterada, aoSair }) {
  const [formulario, setFormulario] = useState({
    nova_senha: "",
    confirmar_senha: "",
  });

  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const senhaTemMinimo = formulario.nova_senha.trim().length >= 6;
  const senhasConferem =
    formulario.nova_senha.length > 0 &&
    formulario.nova_senha === formulario.confirmar_senha;

  const formularioValido = useMemo(() => {
    return senhaTemMinimo && senhasConferem;
  }, [senhaTemMinimo, senhasConferem]);

  function atualizarCampo(evento) {
    const { name, value } = evento.target;

    setErro("");

    setFormulario((estadoAtual) => ({
      ...estadoAtual,
      [name]: value,
    }));
  }

  async function salvarNovaSenha(evento) {
    evento.preventDefault();

    setErro("");

    if (!senhaTemMinimo) {
      setErro("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (!senhasConferem) {
      setErro("A confirmação da senha não confere.");
      return;
    }

    setSalvando(true);

    try {
      const dados = await apiRequest("/auth/alterar-senha-inicial/", {
        method: "POST",
        body: JSON.stringify(formulario),
      });

      aoSenhaAlterada(dados.usuario);
    } catch (erroApi) {
      setErro(erroApi.message || "Não foi possível alterar a senha.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f5f7] p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center bg-slate-950 text-white">
            <FiCpu size={26} />
          </div>

          <div>
            <p className="text-lg font-bold text-slate-950">
              Inventário de T.I.
            </p>
            <p className="text-sm text-slate-500">
              Primeiro acesso
            </p>
          </div>
        </div>

        <div className="border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5 sm:p-6">
            <h1 className="text-xl font-black text-slate-950">
              Definir nova senha
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Olá, <strong>{usuario?.nome || usuario?.username}</strong>. Para continuar,
              crie uma senha própria para acessar o sistema.
            </p>
          </div>

          <form onSubmit={salvarNovaSenha} className="space-y-4 p-5 sm:p-6">
            {erro && (
              <div className="flex gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                <FiAlertCircle className="mt-0.5 shrink-0" size={18} />
                <p className="leading-5">{erro}</p>
              </div>
            )}

            <CampoSenha
              label="Nova senha"
              name="nova_senha"
              value={formulario.nova_senha}
              onChange={atualizarCampo}
              placeholder="Digite sua nova senha"
              mostrar={mostrarNovaSenha}
              aoAlternarMostrar={() =>
                setMostrarNovaSenha((estadoAtual) => !estadoAtual)
              }
            />

            <CampoSenha
              label="Confirmar nova senha"
              name="confirmar_senha"
              value={formulario.confirmar_senha}
              onChange={atualizarCampo}
              placeholder="Digite novamente a nova senha"
              mostrar={mostrarConfirmacao}
              aoAlternarMostrar={() =>
                setMostrarConfirmacao((estadoAtual) => !estadoAtual)
              }
            />

            <div className="border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-2 text-xs leading-5 text-slate-600">
                <FiCheckCircle className="mt-0.5 shrink-0 text-emerald-700" size={15} />
                A senha precisa ter pelo menos 6 caracteres. Após salvar, você será levado
                automaticamente ao dashboard.
              </div>
            </div>

            <button
              type="submit"
              disabled={salvando || !formularioValido}
              className="flex w-full items-center justify-center gap-2 bg-slate-950 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvando ? (
                <>
                  <span className="h-4 w-4 animate-spin border-2 border-white/40 border-t-white" />
                  Salvando...
                </>
              ) : (
                "Salvar nova senha"
              )}
            </button>

            <button
              type="button"
              onClick={aoSair}
              className="flex w-full items-center justify-center gap-2 border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
            >
              <FiLogOut size={16} />
              Sair
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          Inventário de T.I. · Aplicação interna
        </p>
      </div>
    </div>
  );
}