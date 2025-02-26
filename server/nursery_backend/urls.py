from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import routers
from plants.views import PlantViewSet, PlantInventoryViewSet

router = routers.DefaultRouter()
router.register(r'plants', PlantViewSet)
router.register(r'inventory', PlantInventoryViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)