import { useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiArrowRight,
  FiCheckCircle,
  FiCpu,
  FiDownload,
  FiEye,
  FiEyeOff,
  FiLock,
  FiUser,
} from "react-icons/fi";

import { apiRequest } from "../services/api";

function CampoTexto({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  icon: Icone,
  rightElement,
  onKeyUp,
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <div className="flex items-center border border-slate-300 bg-white transition-colors focus-within:border-slate-950">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center text-slate-400">
          <Icone size={18} />
        </div>

        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onKeyUp={onKeyUp}
          className="min-w-0 flex-1 bg-transparent px-0 py-3 text-sm font-semibold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400"
        />

        {rightElement && (
          <div className="flex h-12 shrink-0 items-center justify-center px-2">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
}

function verificarModoInstalado() {
  const standaloneBrowser = window.matchMedia?.("(display-mode: standalone)")?.matches;
  const standaloneIos = window.navigator.standalone === true;

  return Boolean(standaloneBrowser || standaloneIos);
}

export default function LoginPage({ aoEntrar }) {
  const [formulario, setFormulario] = useState({
    username: "",
    password: "",
  });

  const [lembrarUsuario, setLembrarUsuario] = useState(true);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [capsLockAtivo, setCapsLockAtivo] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const [eventoInstalacao, setEventoInstalacao] = useState(null);
  const [appInstalado, setAppInstalado] = useState(false);
  const [instalandoPwa, setInstalandoPwa] = useState(false);

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("inventario-ti-usuario");

    if (usuarioSalvo) {
      setFormulario((estadoAtual) => ({
        ...estadoAtual,
        username: usuarioSalvo,
      }));
    }
  }, []);

  useEffect(() => {
    setAppInstalado(verificarModoInstalado());

    function capturarInstalacao(evento) {
      evento.preventDefault();
      setEventoInstalacao(evento);
    }

    function marcarInstalado() {
      setAppInstalado(true);
      setEventoInstalacao(null);
    }

    window.addEventListener("beforeinstallprompt", capturarInstalacao);
    window.addEventListener("appinstalled", marcarInstalado);

    return () => {
      window.removeEventListener("beforeinstallprompt", capturarInstalacao);
      window.removeEventListener("appinstalled", marcarInstalado);
    };
  }, []);

  const formularioValido = useMemo(() => {
    return (
      formulario.username.trim().length > 0 &&
      formulario.password.trim().length > 0
    );
  }, [formulario]);

  const podeMostrarBotaoInstalar = Boolean(eventoInstalacao) && !appInstalado;

  function atualizarCampo(evento) {
    const { name, value } = evento.target;

    setErro("");

    setFormulario((estadoAtual) => ({
      ...estadoAtual,
      [name]: value,
    }));
  }

  function verificarCapsLock(evento) {
    setCapsLockAtivo(evento.getModifierState?.("CapsLock") || false);
  }

  async function instalarAplicativo() {
    if (!eventoInstalacao) {
      return;
    }

    setInstalandoPwa(true);

    try {
      eventoInstalacao.prompt();

      const escolha = await eventoInstalacao.userChoice;

      if (escolha?.outcome === "accepted") {
        setAppInstalado(true);
      }

      setEventoInstalacao(null);
    } finally {
      setInstalandoPwa(false);
    }
  }

  async function entrar(evento) {
    evento.preventDefault();

    setErro("");

    if (!formulario.username.trim()) {
      setErro("Informe o usuário para acessar o sistema.");
      return;
    }

    if (!formulario.password.trim()) {
      setErro("Informe a senha para acessar o sistema.");
      return;
    }

    setCarregando(true);

    try {
      const dados = await apiRequest("/auth/login/", {
        method: "POST",
        body: JSON.stringify({
          username: formulario.username.trim(),
          password: formulario.password,
        }),
      });

      if (lembrarUsuario) {
        localStorage.setItem(
          "inventario-ti-usuario",
          formulario.username.trim()
        );
      } else {
        localStorage.removeItem("inventario-ti-usuario");
      }

      aoEntrar(dados.usuario);
    } catch (erroApi) {
      setErro(erroApi.message || "Não foi possível fazer login.");
    } finally {
      setCarregando(false);
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
              Controle interno
            </p>
          </div>
        </div>

        <div className="border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5 sm:p-6">
            <h1 className="text-xl font-black text-slate-950">
              Entrar no sistema
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Use seu usuário e senha para acessar o painel.
            </p>
          </div>

          <form onSubmit={entrar} className="space-y-4 p-5 sm:p-6">
            {erro && (
              <div className="flex gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                <FiAlertCircle className="mt-0.5 shrink-0" size={18} />
                <p className="leading-5">{erro}</p>
              </div>
            )}

            {podeMostrarBotaoInstalar && (
              <button
                type="button"
                onClick={instalarAplicativo}
                disabled={instalandoPwa}
                className="flex w-full items-center justify-center gap-2 border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiDownload size={17} />
                {instalandoPwa ? "Abrindo instalação..." : "Instalar aplicativo"}
              </button>
            )}

            <CampoTexto
              label="Usuário"
              name="username"
              value={formulario.username}
              onChange={atualizarCampo}
              placeholder="Ex: admin"
              autoComplete="username"
              icon={FiUser}
            />

            <CampoTexto
              label="Senha"
              name="password"
              type={mostrarSenha ? "text" : "password"}
              value={formulario.password}
              onChange={atualizarCampo}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              icon={FiLock}
              onKeyUp={verificarCapsLock}
              rightElement={
                <button
                  type="button"
                  onClick={() =>
                    setMostrarSenha((estadoAtual) => !estadoAtual)
                  }
                  className="flex h-9 w-9 items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                  title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenha ? (
                    <FiEyeOff size={18} />
                  ) : (
                    <FiEye size={18} />
                  )}
                </button>
              }
            />

            {capsLockAtivo && (
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
                <FiAlertCircle size={15} />
                Caps Lock está ativado.
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={lembrarUsuario}
                  onChange={(evento) =>
                    setLembrarUsuario(evento.target.checked)
                  }
                  className="h-4 w-4"
                />
                Lembrar usuário
              </label>

              <div className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                <FiCheckCircle size={14} />
                Sessão protegida
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando || !formularioValido}
              className="group flex w-full items-center justify-center gap-2 bg-slate-950 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {carregando ? (
                <>
                  <span className="h-4 w-4 animate-spin border-2 border-white/40 border-t-white" />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar
                  <FiArrowRight
                    className="transition-transform group-hover:translate-x-0.5"
                    size={17}
                  />
                </>
              )}
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