import os
import re
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


def mark_progress(func):
    def progress_wrapper(*args, **kwargs):
        Data.set_progress_percentage(0)
        res = func(*args, **kwargs)
        Data.set_progress_percentage(100)
        return res
    return progress_wrapper


class Data:

    media_folder = settings.MEDIA_ROOT
    progress_file = os.path.join(settings.REPOSITORY_ROOT, 'picture_organizer', 'tmp', 'progress.txt')

    def __init__(self):
        pass

    @classmethod
    def is_image(cls, file_name):
        file_name = file_name.lower()
        if file_name.endswith('.jpg') or file_name.endswith('.jpeg') or file_name.endswith('.png'):
            return True
        return False

    @classmethod
    def get_thumbnail_file_name(cls, file_name):
        return "{}.thumbnail".format(os.path.splitext(file_name)[0])

    @classmethod
    def get_progress_percentage(cls):
        with open(cls.progress_file) as f:
            progress = f.read()
        return progress

    @classmethod
    def set_progress_percentage(cls, progress):
        with open(cls.progress_file, 'w') as f:
            f.write(str(progress))

    @classmethod
    def get_files(cls, input_folder, is_new_batch=True):
        data = []
        os.path.supports_unicode_filenames = True
        if os.path.exists(input_folder):
            if is_new_batch:  # Clean the media folder
                for file_name in os.listdir(cls.media_folder):
                    os.remove(os.path.join(cls.media_folder, file_name))

            for i, file_name in enumerate(os.listdir(input_folder)):  # Import the images
                local_file_name = file_name
                pattern = re.compile('^[0-9]{3}-')
                if pattern.match(file_name[:4]):  # If importing files with order number (i.e. 015-test.jpg)
                    local_file_name = file_name[4:]

                file_path = os.path.join(input_folder, file_name)
                local_file_path = os.path.join(cls.media_folder, local_file_name)
                if os.path.isfile(file_path) and cls.is_image(file_name) and not os.path.isfile(local_file_path):
                    shutil.copy(file_path, local_file_path)

                    # Create a thumbnail
                    im = Image.open(local_file_path)
                    im.thumbnail((400, 400))
                    thumbnail = cls.get_thumbnail_file_name(local_file_name)
                    im.save(os.path.join(cls.media_folder, thumbnail), "JPEG")

                    # Send information back to the webpage
                    data.append({
                        'original_file_name': local_file_name,
                        'thumbnail_file_name': thumbnail
                    })

                cls.set_progress_percentage(i * 100 / len(os.listdir(input_folder)))
        return data

    @classmethod
    def save_files(cls, output_folder, files_ordered):
        os.path.supports_unicode_filenames = True
        if os.path.exists(output_folder):
            for i, file_name in enumerate(files_ordered.split(',')):
                output_file_name = '{0:03d}-{1}'.format(i+1, file_name)
                shutil.copy(os.path.join(cls.media_folder, file_name), os.path.join(output_folder, output_file_name))
                cls.set_progress_percentage(i * 100 / len(files_ordered.split(',')))
        return []

    @classmethod
    def get_file_name_with_extension(cls, file_name):
        for full_file_name in os.listdir(cls.media_folder):  # Get from name with extension
            if cls.is_image(full_file_name) and full_file_name.startswith('{}.'.format(file_name)):  # i.e. look for test. and find test.jpg
                file_name = full_file_name
        return file_name

    @classmethod
    def change_file_name(cls, from_name, to_name):
        from_name = cls.get_file_name_with_extension(from_name)
        shutil.move(os.path.join(cls.media_folder, from_name), os.path.join(cls.media_folder, to_name))
        thumbnail_from_name = cls.get_thumbnail_file_name(from_name)
        thumbnail_to_name = cls.get_thumbnail_file_name(to_name)
        shutil.move(os.path.join(cls.media_folder, thumbnail_from_name), os.path.join(cls.media_folder, thumbnail_to_name))
        return {'thumbnail': thumbnail_to_name}

    @classmethod
    def delete_file(cls, file_name):
        file_name = cls.get_file_name_with_extension(file_name)
        os.remove(os.path.join(cls.media_folder, file_name))
        os.remove(os.path.join(cls.media_folder, cls.get_thumbnail_file_name(file_name)))
        return []


@mark_progress
def get_files(request):
    data = []
    if request.GET.get('input_folder'):
        input_folder = request.GET.get('input_folder')
        is_new_batch = request.GET.get('is_new_batch').lower() == 'true'
        data = Data.get_files(input_folder, is_new_batch)
    return JSONResponse({'data': data})


@mark_progress
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


def delete_file(request):
    file_name = request.GET.get('file_name')
    data = Data.delete_file(file_name)
    return JSONResponse({'data': data})


def get_progress(request):
    progress_percentage = Data.get_progress_percentage()
    return JSONResponse({'data': {'progress': progress_percentage}})


def index(request):
    variables = {}
    Data.set_progress_percentage('')
    return render_to_response('picture_organizer/index.html', RequestContext(request, variables))
