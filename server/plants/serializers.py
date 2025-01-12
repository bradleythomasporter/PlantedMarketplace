from rest_framework import serializers
from .models import Plant, PlantImage, PlantInventory

class PlantImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlantImage
        fields = ['id', 'image', 'caption']

class PlantSerializer(serializers.ModelSerializer):
    additional_images = PlantImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Plant
        fields = [
            'id', 'common_name', 'scientific_name', 'description', 
            'care_instructions', 'planting_instructions', 'light_requirement',
            'water_requirement', 'temperature_min', 'temperature_max',
            'humidity_requirement', 'soil_type', 'fertilizer_requirements',
            'mature_height', 'mature_spread', 'growth_rate', 'time_to_maturity',
            'flowering_season', 'flowering_color', 'fruiting_season', 'fragrant',
            'hardiness_zone', 'native_region', 'drought_tolerant', 'deer_resistant',
            'pest_resistant', 'edible', 'indoor_suitable', 'main_image',
            'additional_images', 'created_at', 'updated_at'
        ]

class PlantInventorySerializer(serializers.ModelSerializer):
    plant = PlantSerializer(read_only=True)
    plant_id = serializers.PrimaryKeyRelatedField(
        queryset=Plant.objects.all(), 
        write_only=True,
        source='plant'
    )
    
    class Meta:
        model = PlantInventory
        fields = [
            'id', 'plant', 'plant_id', 'quantity', 'price', 'size',
            'notes', 'seasonal_availability', 'created_at', 'updated_at'
        ]
