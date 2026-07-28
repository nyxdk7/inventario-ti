import json
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import (
    ComputadorUsuario,
    Equipamento,
    Setor,
    SwitchPorta,
    SwitchPortaHistorico,
    SwitchRede,
)
from .utils import normalizar_mac


def resposta_erro(mensagem, status=400, extra=None):
    dados = {"ok": False, "erro": mensagem}
    if extra:
        dados.update(extra)
    return JsonResponse(dados, status=status)


def carregar_json(request):
    try:
        return json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return None


def inteiro_positivo(valor, nome_campo, minimo=0, maximo=128):
    try:
        numero = int(valor)
    except (TypeError, ValueError):
        raise ValueError(f"Informe um valor válido para {nome_campo}.")

    if numero < minimo or numero > maximo:
        raise ValueError(f"{nome_campo} deve estar entre {minimo} e {maximo}.")

    return numero


def obter_setor(setor_id):
    if setor_id in [None, "", "null", "undefined"]:
        return None
    try:
        return Setor.objects.get(pk=int(setor_id))
    except (TypeError, ValueError, Setor.DoesNotExist):
        raise ValueError("Setor informado não foi encontrado.")


def obter_equipamento(equipamento_id, apenas_switch=False):
    if equipamento_id in [None, "", "null", "undefined"]:
        return None
    try:
        equipamento = Equipamento.objects.select_related("setor").get(pk=int(equipamento_id))
    except (TypeError, ValueError, Equipamento.DoesNotExist):
        raise ValueError("Equipamento informado não foi encontrado.")

    if apenas_switch and equipamento.tipo != Equipamento.TIPO_SWITCH:
        raise ValueError("O equipamento relacionado deve ser do tipo Switch.")

    return equipamento


def obter_computador(computador_id):
    if computador_id in [None, "", "null", "undefined"]:
        return None
    try:
        return ComputadorUsuario.objects.select_related("setor").get(pk=int(computador_id))
    except (TypeError, ValueError, ComputadorUsuario.DoesNotExist):
        raise ValueError("Computador informado não foi encontrado.")


def obter_switch(switch_id, excluir_id=None):
    if switch_id in [None, "", "null", "undefined"]:
        return None
    try:
        switch = SwitchRede.objects.select_related("setor", "equipamento").get(pk=int(switch_id))
    except (TypeError, ValueError, SwitchRede.DoesNotExist):
        raise ValueError("Switch informado não foi encontrado.")

    if excluir_id and switch.id == excluir_id:
        raise ValueError("Um switch não pode ser ligado a ele mesmo.")

    return switch


def equipamento_resumido(equipamento):
    if not equipamento:
        return None
    return {
        "id": equipamento.id,
        "tipo": equipamento.tipo,
        "tipo_display": equipamento.tipo_outro_descricao
        if equipamento.tipo == Equipamento.TIPO_OUTRO and equipamento.tipo_outro_descricao
        else equipamento.get_tipo_display(),
        "marca": equipamento.marca,
        "modelo": equipamento.modelo,
        "patrimonio": equipamento.patrimonio or "",
        "numero_serie": equipamento.numero_serie or "",
        "setor": equipamento.setor.nome if equipamento.setor else "",
    }


def computador_resumido(computador):
    if not computador:
        return None
    return {
        "id": computador.id,
        "nome_usuario": computador.nome_usuario,
        "ip_computador": computador.ip_computador,
        "mac_address": computador.mac_address,
        "setor": computador.setor.nome if computador.setor else "",
    }


def switch_resumido(switch):
    if not switch:
        return None
    return {
        "id": switch.id,
        "nome": switch.nome,
        "ip_gerenciamento": switch.ip_gerenciamento or "",
        "localizacao": switch.localizacao,
    }


def descricao_porta(porta):
    if porta.computador:
        return porta.computador.nome_usuario
    if porta.equipamento:
        partes = [porta.equipamento.get_tipo_display(), porta.equipamento.marca, porta.equipamento.modelo]
        return " - ".join([parte for parte in partes if parte])
    if porta.switch_destino:
        return porta.switch_destino.nome
    return porta.descricao_dispositivo or porta.nome or ""


def porta_para_json(porta):
    return {
        "id": porta.id,
        "switch_id": porta.switch_id,
        "numero": porta.numero,
        "tipo_porta": porta.tipo_porta,
        "tipo_porta_display": porta.get_tipo_porta_display(),
        "nome": porta.nome,
        "tipo_dispositivo": porta.tipo_dispositivo,
        "tipo_dispositivo_display": porta.get_tipo_dispositivo_display() if porta.tipo_dispositivo else "",
        "status": porta.status,
        "status_display": porta.get_status_display(),
        "computador": computador_resumido(porta.computador),
        "computador_id": porta.computador_id,
        "equipamento": equipamento_resumido(porta.equipamento),
        "equipamento_id": porta.equipamento_id,
        "switch_destino": switch_resumido(porta.switch_destino),
        "switch_destino_id": porta.switch_destino_id,
        "descricao_dispositivo": porta.descricao_dispositivo,
        "descricao_conexao": descricao_porta(porta),
        "usuario_responsavel": porta.usuario_responsavel,
        "setor": {"id": porta.setor.id, "nome": porta.setor.nome} if porta.setor else None,
        "setor_id": porta.setor_id,
        "ip_conectado": porta.ip_conectado or "",
        "mac_conectado": porta.mac_conectado,
        "vlan": porta.vlan,
        "perfil": porta.perfil,
        "velocidade": porta.velocidade,
        "velocidade_display": porta.get_velocidade_display(),
        "poe": porta.poe,
        "observacoes": porta.observacoes,
        "atualizado_em": porta.atualizado_em.strftime("%d/%m/%Y %H:%M"),
    }


def switch_para_json(switch, incluir_portas=False):
    portas = list(switch.portas.all()) if incluir_portas else []
    if incluir_portas:
        total_ativas = sum(1 for porta in portas if porta.status in [SwitchPorta.STATUS_ATIVA, SwitchPorta.STATUS_UPLINK])
        total_livres = sum(1 for porta in portas if porta.status == SwitchPorta.STATUS_LIVRE)
        total_atencao = sum(
            1 for porta in portas
            if porta.status in [SwitchPorta.STATUS_DESCONECTADA, SwitchPorta.STATUS_BLOQUEADA, SwitchPorta.STATUS_DEFEITUOSA]
        )
    else:
        total_ativas = switch.portas.filter(status__in=[SwitchPorta.STATUS_ATIVA, SwitchPorta.STATUS_UPLINK]).count()
        total_livres = switch.portas.filter(status=SwitchPorta.STATUS_LIVRE).count()
        total_atencao = switch.portas.filter(
            status__in=[SwitchPorta.STATUS_DESCONECTADA, SwitchPorta.STATUS_BLOQUEADA, SwitchPorta.STATUS_DEFEITUOSA]
        ).count()

    dados = {
        "id": switch.id,
        "nome": switch.nome,
        "equipamento": equipamento_resumido(switch.equipamento),
        "equipamento_id": switch.equipamento_id,
        "marca": switch.marca,
        "modelo": switch.modelo,
        "patrimonio": switch.patrimonio or "",
        "numero_serie": switch.numero_serie or "",
        "setor": {"id": switch.setor.id, "nome": switch.setor.nome} if switch.setor else None,
        "setor_id": switch.setor_id,
        "localizacao": switch.localizacao,
        "rack": switch.rack,
        "ip_gerenciamento": switch.ip_gerenciamento or "",
        "quantidade_portas": switch.quantidade_portas,
        "quantidade_portas_sfp": switch.quantidade_portas_sfp,
        "status": switch.status,
        "status_display": switch.get_status_display(),
        "observacoes": switch.observacoes,
        "resumo_portas": {
            "total": switch.quantidade_portas,
            "ativas": total_ativas,
            "livres": total_livres,
            "atencao": total_atencao,
        },
        "criado_em": switch.criado_em.strftime("%d/%m/%Y %H:%M"),
        "atualizado_em": switch.atualizado_em.strftime("%d/%m/%Y %H:%M"),
    }

    if incluir_portas:
        dados["portas"] = [porta_para_json(porta) for porta in portas]

    return dados


def historico_para_json(registro):
    return {
        "id": registro.id,
        "porta_id": registro.porta_id,
        "porta_numero": registro.porta.numero,
        "acao": registro.acao,
        "resumo": registro.resumo,
        "alterado_por": registro.alterado_por,
        "criado_em": registro.criado_em.strftime("%d/%m/%Y %H:%M"),
    }


def snapshot_porta(porta):
    return {
        "nome": porta.nome,
        "tipo_dispositivo": porta.tipo_dispositivo,
        "status": porta.status,
        "computador_id": porta.computador_id,
        "equipamento_id": porta.equipamento_id,
        "switch_destino_id": porta.switch_destino_id,
        "descricao_dispositivo": porta.descricao_dispositivo,
        "usuario_responsavel": porta.usuario_responsavel,
        "setor_id": porta.setor_id,
        "ip_conectado": porta.ip_conectado or "",
        "mac_conectado": porta.mac_conectado,
        "vlan": porta.vlan,
        "perfil": porta.perfil,
        "velocidade": porta.velocidade,
        "poe": porta.poe,
        "observacoes": porta.observacoes,
    }


def gerar_portas(switch):
    limite_rj45 = switch.quantidade_portas - switch.quantidade_portas_sfp
    existentes = {porta.numero: porta for porta in switch.portas.all()}

    for numero in range(1, switch.quantidade_portas + 1):
        tipo = SwitchPorta.TIPO_PORTA_SFP if numero > limite_rj45 else SwitchPorta.TIPO_PORTA_RJ45
        porta = existentes.get(numero)
        if porta:
            if porta.tipo_porta != tipo:
                porta.tipo_porta = tipo
                porta.save(update_fields=["tipo_porta", "atualizado_em"])
        else:
            SwitchPorta.objects.create(switch=switch, numero=numero, tipo_porta=tipo)


def validar_reducao_portas(switch, nova_quantidade):
    portas_removidas = switch.portas.filter(numero__gt=nova_quantidade)
    ocupadas = portas_removidas.filter(
        ~Q(status=SwitchPorta.STATUS_LIVRE)
        | Q(computador__isnull=False)
        | Q(equipamento__isnull=False)
        | Q(switch_destino__isnull=False)
        | ~Q(descricao_dispositivo="")
        | ~Q(nome="")
        | ~Q(observacoes="")
    )
    if ocupadas.exists():
        numeros = ", ".join(str(numero) for numero in ocupadas.values_list("numero", flat=True)[:10])
        raise ValueError(f"Não é possível reduzir: as portas {numeros} possuem informações cadastradas.")

    portas_removidas.delete()


def opcoes_switches(switch_atual_id=None):
    equipamentos_switch = Equipamento.objects.select_related("setor").filter(tipo=Equipamento.TIPO_SWITCH).order_by("marca", "modelo")
    switches = SwitchRede.objects.order_by("nome")
    if switch_atual_id:
        switches = switches.exclude(pk=switch_atual_id)

    return {
        "status_switch": [{"value": valor, "label": rotulo} for valor, rotulo in SwitchRede.STATUS],
        "status_porta": [{"value": valor, "label": rotulo} for valor, rotulo in SwitchPorta.STATUS],
        "tipos_dispositivo": [{"value": valor, "label": rotulo} for valor, rotulo in SwitchPorta.TIPOS_DISPOSITIVO],
        "velocidades": [{"value": valor, "label": rotulo} for valor, rotulo in SwitchPorta.VELOCIDADES],
        "setores": [{"id": setor.id, "nome": setor.nome} for setor in Setor.objects.order_by("nome")],
        "computadores": [computador_resumido(item) for item in ComputadorUsuario.objects.select_related("setor").order_by("nome_usuario")],
        "equipamentos": [equipamento_resumido(item) for item in Equipamento.objects.select_related("setor").order_by("tipo", "marca", "modelo")],
        "equipamentos_switch": [equipamento_resumido(item) for item in equipamentos_switch],
        "switches": [switch_resumido(item) for item in switches],
    }


def preencher_switch(switch, dados):
    switch.nome = (dados.get("nome") or "").strip()
    switch.marca = (dados.get("marca") or "").strip()
    switch.modelo = (dados.get("modelo") or "").strip()
    switch.patrimonio = (dados.get("patrimonio") or "").strip() or None
    switch.numero_serie = (dados.get("numero_serie") or "").strip() or None
    switch.localizacao = (dados.get("localizacao") or "").strip()
    switch.rack = (dados.get("rack") or "").strip()
    switch.ip_gerenciamento = (dados.get("ip_gerenciamento") or "").strip() or None
    switch.status = (dados.get("status") or SwitchRede.STATUS_EM_USO).strip()
    switch.observacoes = (dados.get("observacoes") or "").strip()
    switch.quantidade_portas = inteiro_positivo(dados.get("quantidade_portas", 24), "Quantidade de portas", 2, 128)
    switch.quantidade_portas_sfp = inteiro_positivo(dados.get("quantidade_portas_sfp", 0), "Quantidade de portas SFP", 0, 32)
    switch.setor = obter_setor(dados.get("setor_id"))
    switch.equipamento = obter_equipamento(dados.get("equipamento_id"), apenas_switch=True)


def preencher_porta(porta, dados):
    porta.nome = (dados.get("nome") or "").strip()
    porta.tipo_dispositivo = (dados.get("tipo_dispositivo") or "").strip()
    porta.status = (dados.get("status") or SwitchPorta.STATUS_LIVRE).strip()
    porta.descricao_dispositivo = (dados.get("descricao_dispositivo") or "").strip()
    porta.usuario_responsavel = (dados.get("usuario_responsavel") or "").strip()
    porta.setor = obter_setor(dados.get("setor_id"))
    porta.ip_conectado = (dados.get("ip_conectado") or "").strip() or None
    porta.mac_conectado = (dados.get("mac_conectado") or "").strip()
    porta.vlan = (dados.get("vlan") or "").strip()
    porta.perfil = (dados.get("perfil") or "").strip()
    porta.velocidade = (dados.get("velocidade") or SwitchPorta.VELOCIDADE_AUTO).strip()
    porta.poe = bool(dados.get("poe"))
    porta.observacoes = (dados.get("observacoes") or "").strip()

    porta.computador = obter_computador(dados.get("computador_id"))
    porta.equipamento = obter_equipamento(dados.get("equipamento_id"))
    porta.switch_destino = obter_switch(dados.get("switch_destino_id"), excluir_id=porta.switch_id)

    if porta.computador:
        porta.equipamento = None
        porta.switch_destino = None
        if not porta.setor:
            porta.setor = porta.computador.setor
        if not porta.ip_conectado:
            porta.ip_conectado = porta.computador.ip_computador
        if not porta.mac_conectado:
            porta.mac_conectado = porta.computador.mac_address
        if not porta.tipo_dispositivo:
            porta.tipo_dispositivo = SwitchPorta.DISPOSITIVO_COMPUTADOR
        if porta.status == SwitchPorta.STATUS_LIVRE:
            porta.status = SwitchPorta.STATUS_ATIVA
    elif porta.equipamento:
        porta.computador = None
        porta.switch_destino = None
        if not porta.setor:
            porta.setor = porta.equipamento.setor
        if not porta.tipo_dispositivo:
            porta.tipo_dispositivo = SwitchPorta.DISPOSITIVO_OUTRO
        if porta.status == SwitchPorta.STATUS_LIVRE:
            porta.status = SwitchPorta.STATUS_ATIVA
    elif porta.switch_destino:
        porta.computador = None
        porta.equipamento = None
        porta.tipo_dispositivo = SwitchPorta.DISPOSITIVO_SWITCH
        if porta.status == SwitchPorta.STATUS_LIVRE:
            porta.status = SwitchPorta.STATUS_UPLINK
    elif porta.descricao_dispositivo and porta.status == SwitchPorta.STATUS_LIVRE:
        porta.status = SwitchPorta.STATUS_ATIVA

    if porta.mac_conectado:
        porta.mac_conectado = normalizar_mac(porta.mac_conectado)


@csrf_exempt
@require_http_methods(["GET", "POST"])
def switches(request):
    if request.method == "GET":
        busca = request.GET.get("q", "").strip()
        queryset = SwitchRede.objects.select_related("setor", "equipamento").prefetch_related("portas")
        if busca:
            queryset = queryset.filter(
                Q(nome__icontains=busca)
                | Q(marca__icontains=busca)
                | Q(modelo__icontains=busca)
                | Q(patrimonio__icontains=busca)
                | Q(numero_serie__icontains=busca)
                | Q(ip_gerenciamento__icontains=busca)
                | Q(setor__nome__icontains=busca)
                | Q(localizacao__icontains=busca)
                | Q(rack__icontains=busca)
            )

        return JsonResponse({
            "ok": True,
            "total": queryset.count(),
            "resultados": [switch_para_json(item) for item in queryset],
            "opcoes": opcoes_switches(),
        })

    dados = carregar_json(request)
    if dados is None:
        return resposta_erro("JSON inválido.")

    switch = SwitchRede()
    try:
        with transaction.atomic():
            preencher_switch(switch, dados)
            switch.full_clean()
            switch.save()
            gerar_portas(switch)
    except ValueError as erro:
        return resposta_erro(str(erro))
    except ValidationError as erro:
        return resposta_erro(erro.message_dict if hasattr(erro, "message_dict") else erro.messages)
    except IntegrityError:
        return resposta_erro("Já existe um switch com o mesmo nome, patrimônio, série, IP ou equipamento relacionado.", status=409)

    switch = SwitchRede.objects.select_related("setor", "equipamento").prefetch_related("portas").get(pk=switch.pk)
    return JsonResponse({"ok": True, "mensagem": "Switch cadastrado com sucesso.", "switch": switch_para_json(switch, incluir_portas=True)}, status=201)


@csrf_exempt
@require_http_methods(["GET", "PUT", "PATCH", "DELETE"])
def switch_detalhe(request, pk):
    switch = get_object_or_404(
        SwitchRede.objects.select_related("setor", "equipamento").prefetch_related(
            "portas__setor",
            "portas__computador__setor",
            "portas__equipamento__setor",
            "portas__switch_destino",
        ),
        pk=pk,
    )

    if request.method == "GET":
        historico = SwitchPortaHistorico.objects.select_related("porta").filter(porta__switch=switch)[:60]
        return JsonResponse({
            "ok": True,
            "switch": switch_para_json(switch, incluir_portas=True),
            "historico": [historico_para_json(item) for item in historico],
            "opcoes": opcoes_switches(switch.id),
        })

    if request.method == "DELETE":
        nome = switch.nome
        switch.delete()
        return JsonResponse({"ok": True, "mensagem": f"Switch {nome} removido com sucesso."})

    dados = carregar_json(request)
    if dados is None:
        return resposta_erro("JSON inválido.")

    quantidade_anterior = switch.quantidade_portas
    try:
        with transaction.atomic():
            preencher_switch(switch, dados)
            if switch.quantidade_portas < quantidade_anterior:
                validar_reducao_portas(switch, switch.quantidade_portas)
            switch.full_clean()
            switch.save()
            gerar_portas(switch)
    except ValueError as erro:
        return resposta_erro(str(erro))
    except ValidationError as erro:
        return resposta_erro(erro.message_dict if hasattr(erro, "message_dict") else erro.messages)
    except IntegrityError:
        return resposta_erro("Já existe outro switch com o mesmo nome, patrimônio, série, IP ou equipamento relacionado.", status=409)

    switch = SwitchRede.objects.select_related("setor", "equipamento").prefetch_related("portas").get(pk=switch.pk)
    return JsonResponse({"ok": True, "mensagem": "Switch atualizado com sucesso.", "switch": switch_para_json(switch, incluir_portas=True)})


@csrf_exempt
@require_http_methods(["GET", "PUT", "PATCH"])
def switch_porta_detalhe(request, pk):
    porta = get_object_or_404(
        SwitchPorta.objects.select_related(
            "switch",
            "setor",
            "computador__setor",
            "equipamento__setor",
            "switch_destino",
        ),
        pk=pk,
    )

    if request.method == "GET":
        return JsonResponse({"ok": True, "porta": porta_para_json(porta)})

    dados = carregar_json(request)
    if dados is None:
        return resposta_erro("JSON inválido.")

    anterior = snapshot_porta(porta)
    try:
        with transaction.atomic():
            preencher_porta(porta, dados)
            porta.full_clean()
            porta.save()
            novo = snapshot_porta(porta)

            if anterior != novo:
                usuario = "Sistema"
                if getattr(request, "user", None) and request.user.is_authenticated:
                    usuario = request.user.get_full_name() or request.user.username

                SwitchPortaHistorico.objects.create(
                    porta=porta,
                    acao="Atualização de porta",
                    resumo=f"Porta {porta.numero} atualizada: {porta.get_status_display()} - {descricao_porta(porta) or 'sem dispositivo'}",
                    dados_anteriores=anterior,
                    dados_novos=novo,
                    alterado_por=usuario,
                )
    except ValueError as erro:
        return resposta_erro(str(erro))
    except ValidationError as erro:
        return resposta_erro(erro.message_dict if hasattr(erro, "message_dict") else erro.messages)

    porta = SwitchPorta.objects.select_related(
        "switch", "setor", "computador__setor", "equipamento__setor", "switch_destino"
    ).get(pk=porta.pk)
    return JsonResponse({"ok": True, "mensagem": f"Porta {porta.numero} atualizada com sucesso.", "porta": porta_para_json(porta)})
