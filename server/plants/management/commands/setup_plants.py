from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from server.plants.models import Plant, PlantImage

class Command(BaseCommand):
    help = 'Initialize plants database with sample data'

    def handle(self, *args, **kwargs):
        # Create a sample user if doesn't exist
        user, created = User.objects.get_or_create(
            username='demo_nursery',
            defaults={
                'email': 'demo@example.com',
                'is_staff': True,
            }
        )
        if created:
            user.set_password('demo123')
            user.save()
            self.stdout.write(self.style.SUCCESS('Created demo user'))

        # Sample plants data that matches the CSV format
        plants_data = [
            {
                'common_name': 'Peace Lily',
                'scientific_name': 'Spathiphyllum',
                'description': 'Beautiful indoor plant known for its air-purifying qualities',
                'care_instructions': 'Keep soil moist but not waterlogged. Tolerates low light.',
                'planting_instructions': 'Plant in well-draining potting mix.',
                'light_requirement': 'low',
                'water_requirement': 'medium',
                'temperature_min': 18,
                'temperature_max': 30,
                'humidity_requirement': 50,
                'soil_type': 'Rich, well-draining potting mix',
                'fertilizer_requirements': 'Monthly during growing season',
                'mature_height': 40,
                'mature_spread': 40,
                'growth_rate': 'medium',
                'time_to_maturity': '2-3 years',
                'hardiness_zone': '10-12',
                'native_region': 'Tropical Americas',
                'price': 29.99,
                'quantity': 10,
                'indoor_suitable': True,
            },
            {
                'common_name': 'Snake Plant',
                'scientific_name': 'Sansevieria trifasciata',
                'description': 'Hardy indoor plant with striking upright leaves',
                'care_instructions': 'Very low maintenance, allow soil to dry between watering',
                'planting_instructions': 'Plant in cactus mix or well-draining potting soil',
                'light_requirement': 'low',
                'water_requirement': 'low',
                'temperature_min': 15,
                'temperature_max': 35,
                'humidity_requirement': 30,
                'soil_type': 'Well-draining, cactus mix',
                'fertilizer_requirements': 'Light feeding during growing season',
                'mature_height': 70,
                'mature_spread': 30,
                'growth_rate': 'slow',
                'time_to_maturity': '3-4 years',
                'hardiness_zone': '9-11',
                'native_region': 'West Africa',
                'price': 24.99,
                'quantity': 15,
                'indoor_suitable': True,
                'drought_tolerant': True,
            },
            {
                'common_name': 'Boston Fern',
                'scientific_name': 'Nephrolepis exaltata',
                'description': 'Classic hanging plant with delicate fronds',
                'care_instructions': 'Keep soil consistently moist and humidity high',
                'planting_instructions': 'Plant in rich, organic potting mix',
                'light_requirement': 'medium',
                'water_requirement': 'high',
                'temperature_min': 16,
                'temperature_max': 24,
                'humidity_requirement': 80,
                'soil_type': 'Rich, organic potting mix',
                'fertilizer_requirements': 'Monthly with balanced fertilizer',
                'mature_height': 35,
                'mature_spread': 45,
                'growth_rate': 'medium',
                'time_to_maturity': '1-2 years',
                'hardiness_zone': '10-12',
                'native_region': 'Florida and tropical regions',
                'price': 19.99,
                'quantity': 20,
                'indoor_suitable': True,
            }
        ]

        # Create the sample plants
        for plant_data in plants_data:
            plant, created = Plant.objects.get_or_create(
                common_name=plant_data['common_name'],
                defaults={**plant_data, 'created_by': user}
            )
            status = 'Created' if created else 'Already exists'
            self.stdout.write(self.style.SUCCESS(f'{status}: {plant.common_name}'))

        # Generate CSV file with sample data and instructions
        import csv
        import os

        csv_path = os.path.join(os.path.dirname(__file__), 'sample_plants.csv')
        with open(csv_path, 'w', newline='') as file:
            writer = csv.DictWriter(file, fieldnames=list(plants_data[0].keys()))
            writer.writeheader()
            for plant in plants_data:
                writer.writerow(plant)

        self.stdout.write(self.style.SUCCESS(f'Created sample CSV file at {csv_path}'))
        self.stdout.write(self.style.SUCCESS('Successfully initialized plants database'))