from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import User

class Plant(models.Model):
    LIGHT_CHOICES = [
        ('low', 'Low Light'),
        ('medium', 'Medium Light'),
        ('high', 'Bright Light'),
    ]

    WATER_CHOICES = [
        ('low', 'Low Water'),
        ('medium', 'Medium Water'),
        ('high', 'High Water'),
    ]

    GROWTH_RATE_CHOICES = [
        ('slow', 'Slow'),
        ('medium', 'Medium'),
        ('fast', 'Fast'),
    ]

    SEASON_CHOICES = [
        ('spring', 'Spring'),
        ('summer', 'Summer'),
        ('autumn', 'Autumn'),
        ('winter', 'Winter'),
        ('year_round', 'Year Round'),
    ]

    # Basic Information
    common_name = models.CharField(max_length=100)
    scientific_name = models.CharField(max_length=100)
    description = models.TextField()
    care_instructions = models.TextField(default='')
    planting_instructions = models.TextField(default='')

    # Care Requirements
    light_requirement = models.CharField(max_length=10, choices=LIGHT_CHOICES, default='medium')
    water_requirement = models.CharField(max_length=10, choices=WATER_CHOICES, default='medium')
    temperature_min = models.IntegerField(validators=[MinValueValidator(-20), MaxValueValidator(50)], default=15)
    temperature_max = models.IntegerField(validators=[MinValueValidator(-20), MaxValueValidator(50)], default=30)
    humidity_requirement = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)], default=50)
    soil_type = models.CharField(max_length=200, default='All purpose potting mix')
    fertilizer_requirements = models.TextField(default='')

    # Growth Information
    mature_height = models.DecimalField(max_digits=5, decimal_places=2, help_text="Height in centimeters", default=30.00)
    mature_spread = models.DecimalField(max_digits=5, decimal_places=2, help_text="Spread in centimeters", default=30.00)
    growth_rate = models.CharField(max_length=10, choices=GROWTH_RATE_CHOICES, default='medium')
    time_to_maturity = models.CharField(max_length=100, default='')

    # Seasonal Information
    flowering_season = models.CharField(max_length=20, choices=SEASON_CHOICES, blank=True, default='')
    flowering_color = models.CharField(max_length=100, blank=True, default='')
    fruiting_season = models.CharField(max_length=20, choices=SEASON_CHOICES, blank=True, default='')
    fragrant = models.BooleanField(default=False)

    # Additional Characteristics
    hardiness_zone = models.CharField(max_length=50, default='')
    native_region = models.CharField(max_length=200, default='')
    drought_tolerant = models.BooleanField(default=False)
    deer_resistant = models.BooleanField(default=False)
    pest_resistant = models.BooleanField(default=False)
    edible = models.BooleanField(default=False)
    indoor_suitable = models.BooleanField(default=False)

    # Business Information
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], default=0.00)
    quantity = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    featured = models.BooleanField(default=False)

    # Images
    main_image = models.ImageField(upload_to='plants/main/', null=True, blank=True)
    additional_images = models.ManyToManyField('PlantImage', blank=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        ordering = ['common_name']

    def __str__(self):
        return f"{self.common_name} ({self.scientific_name})"

class PlantImage(models.Model):
    image = models.ImageField(upload_to='plants/additional/')
    caption = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.plant_set.first().common_name if self.plant_set.exists() else 'Unassigned'}"

class PlantInventory(models.Model):
    plant = models.ForeignKey(Plant, on_delete=models.CASCADE)
    nursery = models.ForeignKey(User, on_delete=models.CASCADE)
    quantity = models.IntegerField(validators=[MinValueValidator(0)])
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    size = models.CharField(max_length=50)  # e.g., "2 gallon", "4 inch pot"
    notes = models.TextField(blank=True)
    seasonal_availability = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Plant inventories"
        unique_together = ('plant', 'nursery', 'size')

    def __str__(self):
        return f"{self.plant.common_name} - {self.nursery.username} ({self.size})"