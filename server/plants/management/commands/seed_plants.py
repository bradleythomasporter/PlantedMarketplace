from django.core.management.base import BaseCommand
from plants.models import Plant
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Seed the database with common plants and their details'

    def handle(self, *args, **options):
        # Create a system user for the seeded plants
        system_user, _ = User.objects.get_or_create(
            username='system',
            defaults={'is_staff': True}
        )

        basic_plants = [
            {
                'common_name': 'Red Robin',
                'scientific_name': 'Photinia × fraseri',
                'description': 'Popular evergreen shrub with bright red young leaves.',
                'care_instructions': 'Regular watering, prune in spring for red growth.',
                'light_requirement': 'medium',
                'water_requirement': 'medium',
                'temperature_min': 0,
                'temperature_max': 30,
                'mature_height': 300,
                'mature_spread': 250,
                'indoor_suitable': False,
            },
            {
                'common_name': 'Lavender',
                'scientific_name': 'Lavandula angustifolia',
                'description': 'Fragrant perennial herb with purple flowers.',
                'care_instructions': 'Well-draining soil, trim after flowering.',
                'light_requirement': 'high',
                'water_requirement': 'low',
                'temperature_min': -5,
                'temperature_max': 35,
                'mature_height': 60,
                'mature_spread': 60,
                'indoor_suitable': False,
            },
            {
                'common_name': 'Peace Lily',
                'scientific_name': 'Spathiphyllum wallisii',
                'description': 'Popular indoor plant with white flowers.',
                'care_instructions': 'Keep soil moist, medium to low light.',
                'light_requirement': 'low',
                'water_requirement': 'medium',
                'temperature_min': 18,
                'temperature_max': 30,
                'mature_height': 40,
                'mature_spread': 40,
                'indoor_suitable': True,
            }
        ]

        for plant_data in basic_plants:
            plant_data['created_by'] = system_user
            Plant.objects.get_or_create(
                scientific_name=plant_data['scientific_name'],
                defaults=plant_data
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded basic plant database'))