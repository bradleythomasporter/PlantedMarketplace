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