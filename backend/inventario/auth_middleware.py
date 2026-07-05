from django.http import JsonResponse

from .auth_api import perfil_usuario


class InventarioAuthMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        caminho = request.path
        metodo = request.method.upper()

        if metodo == "OPTIONS":
            return self.get_response(request)

        if not caminho.startswith("/api/"):
            return self.get_response(request)

        rotas_publicas = [
            "/api/auth/login/",
            "/api/auth/logout/",
            "/api/auth/me/",
        ]

        if caminho in rotas_publicas:
            return self.get_response(request)

        if not request.user.is_authenticated:
            return JsonResponse(
                {
                    "ok": False,
                    "erro": "Usuário não autenticado.",
                    "codigo": "nao_autenticado",
                },
                status=401,
            )

        perfil = perfil_usuario(request.user)

        if perfil == "admin":
            return self.get_response(request)

        if caminho.startswith("/api/auth/usuarios/"):
            return JsonResponse(
                {
                    "ok": False,
                    "erro": "Somente administradores podem gerenciar usuários.",
                },
                status=403,
            )

        if perfil == "consulta":
            if metodo not in ["GET", "HEAD"]:
                return JsonResponse(
                    {
                        "ok": False,
                        "erro": "Perfil Consulta possui acesso somente para visualização.",
                    },
                    status=403,
                )

            return self.get_response(request)

        if perfil == "tecnico":
            if metodo == "DELETE":
                return JsonResponse(
                    {
                        "ok": False,
                        "erro": "Perfil Técnico T.I. não possui permissão para excluir registros.",
                    },
                    status=403,
                )

            if caminho.startswith("/api/setores/") and metodo not in ["GET", "HEAD"]:
                return JsonResponse(
                    {
                        "ok": False,
                        "erro": "Perfil Técnico T.I. não possui permissão para cadastrar ou editar setores.",
                    },
                    status=403,
                )

            if caminho.startswith("/api/relatorios/"):
                return JsonResponse(
                    {
                        "ok": False,
                        "erro": "Perfil Técnico T.I. não possui permissão para gerar relatórios.",
                    },
                    status=403,
                )

            return self.get_response(request)

        return JsonResponse(
            {
                "ok": False,
                "erro": "Perfil de usuário inválido ou sem permissão.",
            },
            status=403,
        )