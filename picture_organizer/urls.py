"""picture_organizer URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.8/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Add an import:  from blog import urls as blog_urls
    2. Add a URL to urlpatterns:  url(r'^blog/', include(blog_urls))
"""
from picture_organizer.views import index, get_files, save_files, change_file_name, delete_file, get_progress
from django.conf.urls.static import static
from django.conf.urls import include, url
from django.contrib import admin
from django.conf import settings

urlpatterns = [
    url(r'^$', index, name='index'),
    url(r'^get_progress/$', get_progress, name='get_progress'),
    url(r'^get_files/$', get_files, name='get_files'),
    url(r'^save_files/$', save_files, name='save_files'),
    url(r'^change_file_name/$', change_file_name, name='change_file_name'),
    url(r'^delete_file/$', delete_file, name='delete_file'),
    # url(r'^admin/', include(admin.site.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
