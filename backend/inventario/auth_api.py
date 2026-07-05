import json

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.models import Group
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods


User = get_user_model()


PERFIS = {
    "admin": "Administrador",
    "tecnico": "Técnico T.I.",
    "consulta": "Consulta",
}

GRUPOS_PERFIS = {
    "admin": "Administrador",
    "tecnico": "Técnico T.I.",
    "consulta": "Consulta",
}


def ler_json(request):
    if not request.body:
        return {}

    try:
        return json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return {}


def criar_grupos_padrao():
    for nome_grupo in GRUPOS_PERFIS.values():
        Group.objects.get_or_create(name=nome_grupo)


def perfil_usuario(user):
    if not user or not user.is_authenticated:
        return None

    if user.is_superuser:
        return "admin"

    criar_grupos_padrao()

    for perfil, nome_grupo in GRUPOS_PERFIS.items():
        if user.groups.filter(name=nome_grupo).exists():
            return perfil

    return "consulta"


def perfil_display(perfil):
    return PERFIS.get(perfil, "Consulta")


def usuario_para_json(user):
    perfil = perfil_usuario(user)

    return {
        "id": user.id,
        "username": user.username,
        "nome": user.get_full_name() or user.username,
        "email": user.email or "",
        "is_active": user.is_active,
        "is_superuser": user.is_superuser,
        "perfil": perfil,
        "perfil_display": perfil_display(perfil),
        "ultimo_login": user.last_login.strftime("%d/%m/%Y %H:%M") if user.last_login else "-",
        "criado_em": user.date_joined.strftime("%d/%m/%Y %H:%M") if user.date_joined else "-",
    }


def aplicar_perfil(user, perfil):
    criar_grupos_padrao()

    perfil = perfil if perfil in PERFIS else "consulta"

    user.groups.clear()

    grupo = Group.objects.get(name=GRUPOS_PERFIS[perfil])
    user.groups.add(grupo)

    user.is_staff = perfil == "admin"
    user.is_superuser = perfil == "admin" and user.is_superuser

    user.save()

    return perfil


def usuario_eh_admin(user):
    return perfil_usuario(user) == "admin"


def erro_sem_permissao():
    return JsonResponse(
        {
            "ok": False,
            "erro": "Você não tem permissão para executar esta ação.",
        },
        status=403,
    )


@csrf_exempt
@require_http_methods(["POST"])
def login_view(request):
    dados = ler_json(request)

    username = str(dados.get("username", "")).strip()
    password = str(dados.get("password", ""))

    if not username or not password:
        return JsonResponse(
            {
                "ok": False,
                "erro": "Informe usuário e senha.",
            },
            status=400,
        )

    user = authenticate(request, username=username, password=password)

    if user is None:
        return JsonResponse(
            {
                "ok": False,
                "erro": "Usuário ou senha inválidos.",
            },
            status=401,
        )

    if not user.is_active:
        return JsonResponse(
            {
                "ok": False,
                "erro": "Este usuário está inativo.",
            },
            status=403,
        )

    criar_grupos_padrao()
    login(request, user)

    return JsonResponse(
        {
            "ok": True,
            "mensagem": "Login realizado com sucesso.",
            "usuario": usuario_para_json(user),
        }
    )


@csrf_exempt
@require_http_methods(["POST"])
def logout_view(request):
    logout(request)

    return JsonResponse(
        {
            "ok": True,
            "mensagem": "Logout realizado com sucesso.",
        }
    )


@require_http_methods(["GET"])
def me_view(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {
                "ok": True,
                "autenticado": False,
                "usuario": None,
            }
        )

    return JsonResponse(
        {
            "ok": True,
            "autenticado": True,
            "usuario": usuario_para_json(request.user),
        }
    )


@csrf_exempt
@require_http_methods(["GET", "POST"])
def usuarios_view(request):
    if not usuario_eh_admin(request.user):
        return erro_sem_permissao()

    criar_grupos_padrao()

    if request.method == "GET":
        busca = request.GET.get("q", "").strip()

        queryset = User.objects.all().order_by("username")

        if busca:
            queryset = queryset.filter(username__icontains=busca)

        return JsonResponse(
            {
                "ok": True,
                "resultados": [usuario_para_json(usuario) for usuario in queryset],
                "opcoes": {
                    "perfis": [
                        {"value": chave, "label": valor}
                        for chave, valor in PERFIS.items()
                    ]
                },
            }
        )

    dados = ler_json(request)

    username = str(dados.get("username", "")).strip()
    nome = str(dados.get("nome", "")).strip()
    email = str(dados.get("email", "")).strip()
    password = str(dados.get("password", "")).strip()
    perfil = str(dados.get("perfil", "consulta")).strip()
    is_active = bool(dados.get("is_active", True))

    if not username:
        return JsonResponse(
            {
                "ok": False,
                "erro": "Informe o nome de usuário.",
            },
            status=400,
        )

    if not password:
        return JsonResponse(
            {
                "ok": False,
                "erro": "Informe uma senha inicial.",
            },
            status=400,
        )

    if User.objects.filter(username__iexact=username).exists():
        return JsonResponse(
            {
                "ok": False,
                "erro": "Já existe um usuário com esse login.",
            },
            status=409,
        )

    user = User.objects.create_user(
        username=username,
        password=password,
        email=email,
    )

    user.first_name = nome
    user.is_active = is_active
    user.save()

    aplicar_perfil(user, perfil)

    return JsonResponse(
        {
            "ok": True,
            "mensagem": "Usuário cadastrado com sucesso.",
            "usuario": usuario_para_json(user),
        },
        status=201,
    )


@csrf_exempt
@require_http_methods(["GET", "PUT", "PATCH", "DELETE"])
def usuario_detalhe_view(request, pk):
    if not usuario_eh_admin(request.user):
        return erro_sem_permissao()

    criar_grupos_padrao()

    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return JsonResponse(
            {
                "ok": False,
                "erro": "Usuário não encontrado.",
            },
            status=404,
        )

    if request.method == "GET":
        return JsonResponse(
            {
                "ok": True,
                "usuario": usuario_para_json(user),
            }
        )

    if request.method == "DELETE":
        if user.id == request.user.id:
            return JsonResponse(
                {
                    "ok": False,
                    "erro": "Você não pode excluir o próprio usuário logado.",
                },
                status=400,
            )

        username = user.username
        user.delete()

        return JsonResponse(
            {
                "ok": True,
                "mensagem": f"Usuário {username} removido com sucesso.",
            }
        )

    dados = ler_json(request)

    username = str(dados.get("username", user.username)).strip()
    nome = str(dados.get("nome", user.first_name)).strip()
    email = str(dados.get("email", user.email)).strip()
    password = str(dados.get("password", "")).strip()
    perfil = str(dados.get("perfil", perfil_usuario(user))).strip()
    is_active = bool(dados.get("is_active", user.is_active))

    if not username:
        return JsonResponse(
            {
                "ok": False,
                "erro": "Informe o nome de usuário.",
            },
            status=400,
        )

    duplicado = (
        User.objects
        .filter(username__iexact=username)
        .exclude(pk=user.pk)
        .exists()
    )

    if duplicado:
        return JsonResponse(
            {
                "ok": False,
                "erro": "Já existe outro usuário com esse login.",
            },
            status=409,
        )

    user.username = username
    user.first_name = nome
    user.email = email
    user.is_active = is_active

    if password:
        user.set_password(password)

    user.save()

    aplicar_perfil(user, perfil)

    return JsonResponse(
        {
            "ok": True,
            "mensagem": "Usuário atualizado com sucesso.",
            "usuario": usuario_para_json(user),
        }
    )