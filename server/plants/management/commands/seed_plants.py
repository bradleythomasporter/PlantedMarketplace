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

        plants_data = [
            {
                'common_name': 'Peace Lily',
                'scientific_name': 'Spathiphyllum wallisii',
                'description': 'The Peace Lily is a popular indoor plant known for its elegant white flowers and glossy dark green leaves. It is also celebrated for its air-purifying qualities.',
                'care_instructions': 'Keep the soil consistently moist but not waterlogged. Wipe leaves occasionally to remove dust. Trim yellowing leaves and spent flowers at the base.',
                'planting_instructions': 'Plant in well-draining potting mix. Choose a pot with drainage holes that\'s slightly larger than the root ball.',
                'light_requirement': 'low',
                'water_requirement': 'medium',
                'temperature_min': 18,
                'temperature_max': 30,
                'humidity_requirement': 50,
                'soil_type': 'Rich, well-draining potting mix',
                'fertilizer_requirements': 'Feed with balanced liquid fertilizer every 6-8 weeks during growing season',
                'mature_height': 40,
                'mature_spread': 40,
                'growth_rate': 'medium',
                'time_to_maturity': '2-3 years',
                'hardiness_zone': '10-12',
                'native_region': 'Tropical Americas',
                'indoor_suitable': True,
                'drought_tolerant': False,
                'fragrant': True,
            },
            {
                'common_name': 'Snake Plant',
                'scientific_name': 'Dracaena trifasciata',
                'description': 'The Snake Plant is a hardy, upright plant with stiff, sword-like leaves. It\'s one of the most tolerant indoor plants and excellent for air purification.',
                'care_instructions': 'Allow soil to dry between waterings. Highly tolerant of low light conditions and irregular watering.',
                'planting_instructions': 'Plant in well-draining cactus or succulent mix. Can be divided when mature.',
                'light_requirement': 'low',
                'water_requirement': 'low',
                'temperature_min': 15,
                'temperature_max': 35,
                'humidity_requirement': 30,
                'soil_type': 'Well-draining cactus or succulent mix',
                'fertilizer_requirements': 'Light feeding with balanced fertilizer during growing season',
                'mature_height': 70,
                'mature_spread': 30,
                'growth_rate': 'slow',
                'time_to_maturity': '3-4 years',
                'hardiness_zone': '9-11',
                'native_region': 'West Africa',
                'indoor_suitable': True,
                'drought_tolerant': True,
                'fragrant': False,
            },
            {
                'common_name': 'Monstera',
                'scientific_name': 'Monstera deliciosa',
                'description': 'The Monstera is famous for its large, glossy, perforated leaves. This tropical plant adds a dramatic accent to any indoor space.',
                'care_instructions': 'Water when top soil feels dry. Maintain good humidity and provide support for climbing.',
                'planting_instructions': 'Use rich, well-draining potting mix. Provide moss pole or trellis for support.',
                'light_requirement': 'medium',
                'water_requirement': 'medium',
                'temperature_min': 18,
                'temperature_max': 30,
                'humidity_requirement': 60,
                'soil_type': 'Rich, well-draining potting mix with orchid bark',
                'fertilizer_requirements': 'Monthly feeding with balanced fertilizer during growing season',
                'mature_height': 200,
                'mature_spread': 100,
                'growth_rate': 'fast',
                'time_to_maturity': '2-3 years',
                'hardiness_zone': '10-12',
                'native_region': 'Southern Mexico and Central America',
                'indoor_suitable': True,
                'drought_tolerant': False,
                'fragrant': False,
            }
        ]

        for plant_data in plants_data:
            plant_data['created_by'] = system_user
            Plant.objects.get_or_create(
                scientific_name=plant_data['scientific_name'],
                defaults=plant_data
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded plant database'))
