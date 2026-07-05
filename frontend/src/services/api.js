const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export async function apiRequest(endpoint, options = {}) {
  const body = options.body;
  const isFormData = body instanceof FormData;
  const temBody = body !== undefined && body !== null;

  const headers = {
    ...(temBody && !isFormData ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };

  const resposta = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers,
  });

  const contentType = resposta.headers.get("content-type") || "";
  const dados = contentType.includes("application/json")
    ? await resposta.json()
    : {};

  if (!resposta.ok) {
    const erro = new Error(dados.erro || "Erro na comunicação com o servidor.");
    erro.status = resposta.status;
    erro.dados = dados;

    if (resposta.status === 401) {
      window.dispatchEvent(new CustomEvent("sessao-expirada"));
    }

    throw erro;
  }

  return dados;
}

export { API_BASE_URL };