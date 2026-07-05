from django.urls import path

from . import auth_api, relatorios, views


urlpatterns = [
    path("auth/login/", auth_api.login_view, name="auth_login"),
    path("auth/logout/", auth_api.logout_view, name="auth_logout"),
    path("auth/me/", auth_api.me_view, name="auth_me"),
    path("auth/usuarios/", auth_api.usuarios_view, name="auth_usuarios"),
    path("auth/usuarios/<int:pk>/", auth_api.usuario_detalhe_view, name="auth_usuario_detalhe"),

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