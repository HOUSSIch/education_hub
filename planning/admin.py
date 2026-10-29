from django.contrib import admin

from .models import (CreneauEmploiDuTemps, EmploiDuTempsSemaine, PlanningEtude,
                     ReclamationPlanning, SessionEtude)


admin.site.register(PlanningEtude)
admin.site.register(SessionEtude)
admin.site.register(EmploiDuTempsSemaine)
admin.site.register(CreneauEmploiDuTemps)
admin.site.register(ReclamationPlanning)
