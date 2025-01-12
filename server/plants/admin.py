from django.contrib import admin
from django.utils.html import format_html
from .models import Plant, PlantImage, PlantInventory

class PlantImageInline(admin.TabularInline):
    model = Plant.additional_images.through
    extra = 1

class PlantInventoryInline(admin.TabularInline):
    model = PlantInventory
    extra = 1

@admin.register(Plant)
class PlantAdmin(admin.ModelAdmin):
    fieldsets = (
        ('Basic Information', {
            'fields': ('common_name', 'scientific_name', 'description', 
                      'care_instructions', 'planting_instructions')
        }),
        ('Care Requirements', {
            'fields': ('light_requirement', 'water_requirement', 
                      'temperature_min', 'temperature_max', 
                      'humidity_requirement', 'soil_type',
                      'fertilizer_requirements')
        }),
        ('Growth Information', {
            'fields': ('mature_height', 'mature_spread', 'growth_rate',
                      'time_to_maturity')
        }),
        ('Seasonal Information', {
            'fields': ('flowering_season', 'flowering_color',
                      'fruiting_season', 'fragrant')
        }),
        ('Additional Characteristics', {
            'fields': ('hardiness_zone', 'native_region',
                      'drought_tolerant', 'deer_resistant',
                      'pest_resistant', 'edible', 'indoor_suitable')
        }),
        ('Images', {
            'fields': ('main_image',)
        }),
    )

    list_display = ('common_name', 'scientific_name', 'display_main_image', 
                   'light_requirement', 'water_requirement', 'created_at')
    list_filter = ('light_requirement', 'water_requirement', 'growth_rate',
                  'indoor_suitable', 'flowering_season')
    search_fields = ('common_name', 'scientific_name', 'description')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [PlantImageInline, PlantInventoryInline]
    exclude = ('additional_images',)

    def display_main_image(self, obj):
        if obj.main_image:
            return format_html('<img src="{}" width="50" height="50" />', obj.main_image.url)
        return "No image"
    display_main_image.short_description = 'Image'

@admin.register(PlantImage)
class PlantImageAdmin(admin.ModelAdmin):
    list_display = ('caption', 'display_image', 'created_at')
    search_fields = ('caption',)

    def display_image(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="50" height="50" />', obj.image.url)
        return "No image"
    display_image.short_description = 'Image'

@admin.register(PlantInventory)
class PlantInventoryAdmin(admin.ModelAdmin):
    list_display = ('plant', 'nursery', 'quantity', 'price', 'size', 'updated_at')
    list_filter = ('nursery', 'size')
    search_fields = ('plant__common_name', 'plant__scientific_name', 'nursery__username')
    readonly_fields = ('created_at', 'updated_at')