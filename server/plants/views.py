from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Plant, PlantInventory
from .serializers import PlantSerializer, PlantInventorySerializer

class PlantViewSet(viewsets.ModelViewSet):
    queryset = Plant.objects.all()
    serializer_class = PlantSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Plant.objects.all().order_by('common_name')
        search = self.request.query_params.get('search', None)
        category = self.request.query_params.get('category', None)
        plant_type = self.request.query_params.get('type', None)

        if search:
            queryset = queryset.filter(
                Q(common_name__icontains=search) |
                Q(scientific_name__icontains=search)
            )

        if category:
            if category == 'indoor':
                queryset = queryset.filter(indoor_suitable=True)
            elif category == 'outdoor':
                queryset = queryset.filter(indoor_suitable=False)

        if plant_type:
            if plant_type == 'perennial':
                queryset = queryset.filter(time_to_maturity__icontains='year')
            # Add more plant type filters as needed

        return queryset

    @action(detail=True, methods=['post'])
    def add_to_inventory(self, request, pk=None):
        plant = self.get_object()
        nursery = request.user

        if not nursery or not nursery.is_authenticated:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = PlantInventorySerializer(data={
            'plant_id': plant.id,
            'quantity': request.data.get('quantity', 0),
            'price': request.data.get('price', 0),
            'size': request.data.get('size', ''),
            'notes': request.data.get('notes', ''),
            'seasonal_availability': request.data.get('seasonal_availability', '')
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

        return queryset

    def perform_create(self, serializer):
        serializer.save(nursery=self.request.user)