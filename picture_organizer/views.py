import os
import shutil
from PIL import Image
from django.conf import settings
from django.http import HttpResponse
from django.template import RequestContext
from django.shortcuts import render_to_response
from rest_framework.renderers import JSONRenderer


class JSONResponse(HttpResponse):

    def __init__(self, data, **kwargs):
        content = JSONRenderer().render(data)
        kwargs['content_type'] = 'application/json'
        super(JSONResponse, self).__init__(content, **kwargs)

    @classmethod
    def error(cls, code, msg):
        return JSONResponse({'status': code, 'error': msg})


class Data:
    input_folders = []
    output_folder = ''
    files_ordered = []

    def __init__(self):
        pass

    @classmethod
    def is_image(cls, file_name):
        file_name = file_name.lower()
        if file_name.endswith('.jpg') or file_name.endswith('.jpeg') or file_name.endswith('.png'):
            return True
        return False

    @classmethod
    def get_files(cls, input_folder):
        data = []
        os.path.supports_unicode_filenames = True
        if os.path.exists(input_folder):
            media_folder = settings.MEDIA_ROOT
            for file_name in os.listdir(media_folder):  # Clean the media folder
                os.remove(os.path.join(media_folder, file_name))

            for file_name in os.listdir(input_folder):  # Import the images
                full_file_name = os.path.join(input_folder, file_name)
                if os.path.isfile(full_file_name) and cls.is_image(file_name):
                    local_file_path = os.path.join(media_folder, file_name)
                    shutil.copy(full_file_name, local_file_path)

                    # Create a thumbnail
                    im = Image.open(local_file_path)
                    im.thumbnail((400, 400))
                    thumbnail = "{}.thumbnail".format(os.path.splitext(file_name)[0])
                    im.save(os.path.join(media_folder, thumbnail), "JPEG")

                    # Send information back to the webpage
                    data.append({
                        'original_file_name': file_name,
                        'thumbnail_file_name': thumbnail
                    })
        return data

    @classmethod
    def save_files(cls, output_folder, files_ordered):
        print output_folder, files_ordered
        os.path.supports_unicode_filenames = True
        if os.path.exists(output_folder):
            media_folder = settings.MEDIA_ROOT
            for i, file_name in enumerate(files_ordered.split(',')):
                output_file_name = '{0:03d}-{1}'.format(i+1, file_name)
                shutil.copy(os.path.join(media_folder, file_name), os.path.join(output_folder, output_file_name))
        return []

    @classmethod
    def change_file_name(cls, from_name, to_name):
        media_folder = settings.MEDIA_ROOT
        shutil.move(os.path.join(media_folder, from_name), os.path.join(media_folder, to_name))
        return []


def get_files(request):
    data = []
    if request.GET.get('input_folder'):
        input_folder = request.GET.get('input_folder')
        data = Data.get_files(input_folder)
    return JSONResponse({'data': data})


def save_files(request):
    data = []
    if request.GET.get('output_folder'):
        output_folder = request.GET.get('output_folder')
        files_ordered = request.GET.get('files_ordered')
        data = Data.save_files(output_folder, files_ordered)
    return JSONResponse({'data': data})


def change_file_name(request):
    from_name = request.GET.get('from_name')
    to_name = request.GET.get('to_name')
    data = Data.change_file_name(from_name, to_name)
    return JSONResponse({'data': data})


def index(request):
    variables = {}
    return render_to_response('picture_organizer/index.html', RequestContext(request, variables))
