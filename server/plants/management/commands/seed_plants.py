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
                'common_name': 'Red Robin (Photinia)',
                'scientific_name': 'Photinia × fraseri',
                'description': 'Red Robin is a popular evergreen shrub known for its bright red young leaves that mature to glossy dark green. It makes an excellent hedge or specimen plant.',
                'care_instructions': 'Regular watering until established. Prune in spring to encourage new red growth.',
                'planting_instructions': 'Plant in well-draining soil in full sun to partial shade. Space plants 3-4 feet apart for hedging.',
                'light_requirement': 'medium',
                'water_requirement': 'medium',
                'temperature_min': -5,
                'temperature_max': 35,
                'humidity_requirement': 50,
                'soil_type': 'Well-draining, slightly acidic soil',
                'fertilizer_requirements': 'Feed with balanced fertilizer in spring and summer',
                'mature_height': 300,
                'mature_spread': 250,
                'growth_rate': 'medium',
                'time_to_maturity': '5-7 years',
                'hardiness_zone': '7-9',
                'native_region': 'Hybrid of Asian species',
                'indoor_suitable': False,
                'drought_tolerant': True,
                'fragrant': False,
            },
            {
                'common_name': 'Lavender',
                'scientific_name': 'Lavandula angustifolia',
                'description': 'English lavender is a bushy, strong-scented perennial plant prized for its fragrant purple flowers and silver-green foliage.',
                'care_instructions': 'Well-draining soil is essential. Trim after flowering to maintain shape.',
                'planting_instructions': 'Plant in full sun with good air circulation. Space plants 2-3 feet apart.',
                'light_requirement': 'high',
                'water_requirement': 'low',
                'temperature_min': -15,
                'temperature_max': 35,
                'humidity_requirement': 40,
                'soil_type': 'Well-draining, alkaline soil',
                'fertilizer_requirements': 'Light feeding in spring with low-nitrogen fertilizer',
                'mature_height': 60,
                'mature_spread': 60,
                'growth_rate': 'medium',
                'time_to_maturity': '2-3 years',
                'hardiness_zone': '5-9',
                'native_region': 'Mediterranean',
                'indoor_suitable': False,
                'drought_tolerant': True,
                'fragrant': True,
            },
            {
                'common_name': 'Japanese Maple',
                'scientific_name': 'Acer palmatum',
                'description': 'A small, deciduous tree with delicate, lacy foliage that changes color throughout the seasons, from bright green to brilliant red or orange.',
                'care_instructions': 'Protect from strong winds and hot afternoon sun. Keep soil consistently moist but not waterlogged.',
                'planting_instructions': 'Plant in a sheltered location with dappled shade. Soil should be slightly acidic and rich in organic matter.',
                'light_requirement': 'medium',
                'water_requirement': 'medium',
                'temperature_min': -15,
                'temperature_max': 30,
                'humidity_requirement': 60,
                'soil_type': 'Rich, well-draining, acidic soil',
                'fertilizer_requirements': 'Feed with slow-release fertilizer in spring',
                'mature_height': 400,
                'mature_spread': 400,
                'growth_rate': 'slow',
                'time_to_maturity': '10-15 years',
                'hardiness_zone': '5-8',
                'native_region': 'Japan, Korea',
                'indoor_suitable': False,
                'drought_tolerant': False,
                'fragrant': False,
            },
            {
                'common_name': 'Peace Lily',
                'scientific_name': 'Spathiphyllum wallisii',
                'description': 'The Peace Lily is a popular indoor plant known for its elegant white flowers and glossy dark green leaves. It is also celebrated for its air-purifying qualities.',
                'care_instructions': 'Keep the soil consistently moist but not waterlogged. Wipe leaves occasionally to remove dust.',
                'planting_instructions': 'Plant in well-draining potting mix. Choose a pot with drainage holes.',
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
            }
        ]

        for plant_data in plants_data:
            plant_data['created_by'] = system_user
            Plant.objects.get_or_create(
                scientific_name=plant_data['scientific_name'],
                defaults=plant_data
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded plant database'))