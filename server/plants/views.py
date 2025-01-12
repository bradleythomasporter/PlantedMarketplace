from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
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

        if search:
            queryset = queryset.filter(
                Q(common_name__icontains=search) |
                Q(scientific_name__icontains=search)
            )
        
        if category:
            if category == 'indoor':
                queryset = queryset.filter(indoor_suitable=True)
            # Add more category filters as needed

        return queryset

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
