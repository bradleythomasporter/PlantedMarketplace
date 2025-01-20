from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from plants.models import Plant, PlantImage

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

        # Sample plants data with categories
        plants_data = [
            # Perennials
            {
                'common_name': 'Purple Coneflower',
                'scientific_name': 'Echinacea purpurea',
                'category': 'perennials',
                'description': 'Beautiful purple flowering perennial that attracts butterflies',
                'care_instructions': 'Full sun, well-draining soil',
                'light_requirement': 'high',
                'water_requirement': 'medium',
                'price': 12.99,
                'quantity': 25,
                'drought_tolerant': True,
                'deer_resistant': True,
                'pest_resistant': True,
                'edible': False,
                'indoor_suitable': False,
                'featured': True
            },
            # Indoor Plants
            {
                'common_name': 'Peace Lily',
                'scientific_name': 'Spathiphyllum',
                'category': 'indoor',
                'description': 'Beautiful indoor plant known for its air-purifying qualities',
                'care_instructions': 'Keep soil moist but not waterlogged. Tolerates low light.',
                'light_requirement': 'low',
                'water_requirement': 'medium',
                'price': 29.99,
                'quantity': 10,
                'drought_tolerant': False,
                'deer_resistant': False,
                'pest_resistant': False,
                'edible': False,
                'indoor_suitable': True,
                'featured': True
            },
            # Succulents
            {
                'common_name': 'Jade Plant',
                'scientific_name': 'Crassula ovata',
                'category': 'succulents',
                'description': 'Popular succulent known for its thick, woody stems and oval leaves',
                'care_instructions': 'Bright indirect light, well-draining soil',
                'light_requirement': 'medium',
                'water_requirement': 'low',
                'price': 15.99,
                'quantity': 30,
                'drought_tolerant': True,
                'deer_resistant': True,
                'pest_resistant': True,
                'edible': False,
                'indoor_suitable': True,
                'featured': False
            },
            # Herbs
            {
                'common_name': 'Lavender',
                'scientific_name': 'Lavandula angustifolia',
                'category': 'herbs',
                'description': 'Fragrant herb with purple flowers, perfect for gardens and containers',
                'care_instructions': 'Full sun, well-draining soil',
                'light_requirement': 'high',
                'water_requirement': 'low',
                'price': 8.99,
                'quantity': 40,
                'drought_tolerant': True,
                'deer_resistant': True,
                'pest_resistant': True,
                'edible': True,
                'indoor_suitable': False,
                'featured': True
            },
            # Vegetables
            {
                'common_name': 'Tomato Plant',
                'scientific_name': 'Solanum lycopersicum',
                'category': 'vegetables',
                'description': 'Popular vegetable plant that produces red fruits',
                'care_instructions': 'Full sun, regular watering',
                'light_requirement': 'high',
                'water_requirement': 'high',
                'price': 6.99,
                'quantity': 50,
                'drought_tolerant': False,
                'deer_resistant': False,
                'pest_resistant': False,
                'edible': True,
                'indoor_suitable': False,
                'featured': True
            },
            # Trees
            {
                'common_name': 'Japanese Maple',
                'scientific_name': 'Acer palmatum',
                'category': 'trees',
                'description': 'Elegant tree known for its beautiful red foliage',
                'care_instructions': 'Partial shade, well-draining soil',
                'light_requirement': 'medium',
                'water_requirement': 'medium',
                'price': 89.99,
                'quantity': 5,
                'drought_tolerant': False,
                'deer_resistant': False,
                'pest_resistant': False,
                'edible': False,
                'indoor_suitable': False,
                'featured': True
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

        # Generate CSV file with sample data
        import csv
        import os

        csv_path = os.path.join(os.path.dirname(__file__), 'sample_plants.csv')
        fieldnames = list(plants_data[0].keys())

        with open(csv_path, 'w', newline='') as file:
            writer = csv.DictWriter(file, fieldnames=fieldnames)
            writer.writeheader()
            for plant in plants_data:
                writer.writerow(plant)

        self.stdout.write(self.style.SUCCESS(f'Created sample CSV file at {csv_path}'))
        self.stdout.write(self.style.SUCCESS('Successfully initialized plants database'))