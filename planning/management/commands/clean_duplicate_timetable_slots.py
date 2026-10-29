from collections import defaultdict

from django.core.management.base import BaseCommand
from django.db import transaction

from planning.models import CreneauEmploiDuTemps


class Command(BaseCommand):
    help = 'Détecte, puis supprime avec --apply les doublons exacts de créneaux d’emploi du temps.'

    def add_arguments(self, parser):
        parser.add_argument('--apply', action='store_true', help='Supprime les doublons après affichage des identifiants concernés.')

    def handle(self, *args, **options):
        groups = defaultdict(list)
        for slot in CreneauEmploiDuTemps.objects.order_by('emploi_du_temps_id', 'jour', 'heure_debut', 'heure_fin', '-is_locked', 'id'):
            groups[(slot.emploi_du_temps_id, slot.jour, slot.heure_debut, slot.heure_fin)].append(slot)
        duplicates = [(key, slots) for key, slots in groups.items() if len(slots) > 1]
        if not duplicates:
            self.stdout.write(self.style.SUCCESS('Aucun doublon de créneau détecté.'))
            return
        delete_ids = []
        for key, slots in duplicates:
            kept, removed = slots[0], slots[1:]
            delete_ids.extend(slot.id for slot in removed)
            self.stdout.write(f'Cellule {key}: conservation #{kept.id}, suppression prévue {[slot.id for slot in removed]}')
        self.stdout.write(f'{len(delete_ids)} créneau(x) en doublon détecté(s).')
        if not options['apply']:
            self.stdout.write(self.style.WARNING('Mode diagnostic : aucune suppression. Relancez avec --apply après vérification.'))
            return
        with transaction.atomic():
            CreneauEmploiDuTemps.objects.filter(id__in=delete_ids).delete()
        self.stdout.write(self.style.SUCCESS(f'Doublons supprimés : {delete_ids}'))
