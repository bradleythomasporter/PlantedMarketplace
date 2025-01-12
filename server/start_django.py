import os
import django
from django.core.management import execute_from_command_line

if __name__ == "__main__":
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nursery_backend.settings')
    try:
        django.setup()
        # Run Django development server on port 8000
        execute_from_command_line(['manage.py', 'runserver', '0.0.0.0:8000'])
    except Exception as e:
        print(f"Error starting Django server: {e}")
