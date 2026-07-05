from django.urls import path

from . import auth_api, backup_api, relatorios, sistema_config_api, views


urlpatterns = [
    path("auth/login/", auth_api.login_view, name="auth_login"),
    path("auth/logout/", auth_api.logout_view, name="auth_logout"),
    path("auth/me/", auth_api.me_view, name="auth_me"),
    path(
        "auth/alterar-senha-inicial/",
        auth_api.alterar_senha_inicial_view,
        name="auth_alterar_senha_inicial",
    ),
    path("auth/usuarios/", auth_api.usuarios_view, name="auth_usuarios"),
    path("auth/usuarios/<int:pk>/", auth_api.usuario_detalhe_view, name="auth_usuario_detalhe"),

    path("backups/", backup_api.backups_view, name="backups"),
    path("backups/executar/", backup_api.executar_backup_view, name="backups_executar"),
    path("backups/baixar/", backup_api.baixar_backup_view, name="backups_baixar"),

    path("configuracoes/", sistema_config_api.configuracoes_view, name="configuracoes"),

    path("dashboard/", views.dashboard_resumo, name="dashboard_resumo"),

    path("computadores/", views.computadores, name="computadores"),
    path("computadores/<int:pk>/", views.computador_detalhe, name="computador_detalhe"),

    path("setores/", views.setores, name="setores"),
    path("setores/<int:pk>/", views.setor_detalhe, name="setor_detalhe"),

    path("equipamentos/", views.equipamentos, name="equipamentos"),
    path("equipamentos/<int:pk>/", views.equipamento_detalhe, name="equipamento_detalhe"),
    path("equipamentos/<int:pk>/fotos/", views.equipamento_fotos, name="equipamento_fotos"),
    path("equipamentos/fotos/<int:pk>/", views.equipamento_foto_detalhe, name="equipamento_foto_detalhe"),

    path("manutencoes/", views.manutencoes, name="manutencoes"),
    path("manutencoes/<int:pk>/", views.manutencao_detalhe, name="manutencao_detalhe"),

    path("relatorios/equipamentos/excel/", relatorios.equipamentos_excel, name="relatorio_equipamentos_excel"),
    path("relatorios/equipamentos/pdf/", relatorios.equipamentos_pdf, name="relatorio_equipamentos_pdf"),

    path("relatorios/computadores/excel/", relatorios.computadores_excel, name="relatorio_computadores_excel"),
    path("relatorios/computadores/pdf/", relatorios.computadores_pdf, name="relatorio_computadores_pdf"),

    path("relatorios/manutencoes/excel/", relatorios.manutencoes_excel, name="relatorio_manutencoes_excel"),
    path("relatorios/manutencoes/pdf/", relatorios.manutencoes_pdf, name="relatorio_manutencoes_pdf"),
]