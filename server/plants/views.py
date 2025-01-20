from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Plant, PlantInventory
from .serializers import PlantSerializer, PlantInventorySerializer
import csv
from io import StringIO

class PlantViewSet(viewsets.ModelViewSet):
    queryset = Plant.objects.all()
    serializer_class = PlantSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Plant.objects.all().order_by('common_name')
        search = self.request.query_params.get('search', None)
        category = self.request.query_params.get('category', None)

        if search:
            queryset = queryset.filter(
                Q(common_name__icontains=search) |
                Q(scientific_name__icontains=search)
            )

        if category == 'indoor':
            queryset = queryset.filter(indoor_suitable=True)
        elif category == 'outdoor':
            queryset = queryset.filter(indoor_suitable=False)

        return queryset

    @action(detail=False, methods=['post'])
    def upload_csv(self, request):
        """Upload plants data via CSV"""
        if not request.FILES.get('file'):
            return Response(
                {"error": "No file provided"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        csv_file = request.FILES['file']
        decoded_file = csv_file.read().decode('utf-8')
        csv_data = csv.DictReader(StringIO(decoded_file))
        plants_data = []
        errors = []

        for row in csv_data:
            try:
                plant_data = {
                    'common_name': row['common_name'],
                    'scientific_name': row['scientific_name'],
                    'description': row['description'],
                    'care_instructions': row.get('care_instructions', ''),
                    'planting_instructions': row.get('planting_instructions', ''),
                    'light_requirement': row.get('light_requirement', 'medium'),
                    'water_requirement': row.get('water_requirement', 'medium'),
                    'temperature_min': int(row.get('temperature_min', 15)),
                    'temperature_max': int(row.get('temperature_max', 30)),
                    'humidity_requirement': int(row.get('humidity_requirement', 50)),
                    'soil_type': row.get('soil_type', ''),
                    'fertilizer_requirements': row.get('fertilizer_requirements', ''),
                    'mature_height': float(row.get('mature_height', 30)),
                    'mature_spread': float(row.get('mature_spread', 30)),
                    'growth_rate': row.get('growth_rate', 'medium'),
                    'time_to_maturity': row.get('time_to_maturity', ''),
                    'hardiness_zone': row.get('hardiness_zone', ''),
                    'native_region': row.get('native_region', ''),
                    'price': float(row.get('price', 0)),
                    'quantity': int(row.get('quantity', 0)),
                    'drought_tolerant': row.get('drought_tolerant', '').lower() == 'true',
                    'deer_resistant': row.get('deer_resistant', '').lower() == 'true',
                    'pest_resistant': row.get('pest_resistant', '').lower() == 'true',
                    'edible': row.get('edible', '').lower() == 'true',
                    'indoor_suitable': row.get('indoor_suitable', '').lower() == 'true',
                }

                serializer = PlantSerializer(data=plant_data)
                if serializer.is_valid():
                    plants_data.append(plant_data)
                else:
                    errors.append(f"Error in row for {row.get('common_name')}: {serializer.errors}")
            except Exception as e:
                errors.append(f"Error processing row for {row.get('common_name')}: {str(e)}")

        if errors:
            return Response(
                {"errors": errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create plants if no errors found
        created_plants = []
        for plant_data in plants_data:
            plant = Plant.objects.create(**plant_data, created_by=request.user)
            created_plants.append(plant)

        return Response({
            "message": f"Successfully imported {len(created_plants)} plants",
            "count": len(created_plants)
        })

    @action(detail=True, methods=['post'])
    def use_as_template(self, request, pk=None):
        """Use an existing plant as a template for inventory"""
        template_plant = self.get_object()
        nursery = request.user

        if not nursery or not nursery.is_authenticated:
            return Response(
                {"error": "Authentication required"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Create inventory item with template data
        serializer = PlantInventorySerializer(data={
            'plant_id': template_plant.id,
            'quantity': request.data.get('quantity', 1),
            'price': request.data.get('price', 0.00),
            'size': request.data.get('size', 'Standard')
        })

        if serializer.is_valid():
            serializer.save(nursery=nursery)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PlantInventoryViewSet(viewsets.ModelViewSet):
    queryset = PlantInventory.objects.all()
    serializer_class = PlantInventorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = PlantInventory.objects.all()
        nursery_id = self.request.query_params.get('nursery_id', None)

        if nursery_id:
            queryset = queryset.filter(nursery_id=nursery_id)

        return queryset.select_related('plant')

    def perform_create(self, serializer):
        serializer.save(nursery=self.request.user)