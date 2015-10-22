import os
import shutil
from rest_framework.renderers import JSONRenderer
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponse
from PIL import Image


class JSONResponse(HttpResponse):

    def __init__(self, data, **kwargs):
        content = JSONRenderer().render(data)
        kwargs['content_type'] = 'application/json'
        super(JSONResponse, self).__init__(content, **kwargs)

    @classmethod
    def error(cls, code, msg):
        return JSONResponse({'status': code, 'error': msg})


def is_image(file_name):
    file_name = file_name.lower()
    if file_name.endswith('.jpg') or file_name.endswith('.jpeg') or file_name.endswith('.png'):
        return True
    return False


def get_files(request):
    data = []
    if request.GET.get('folder'):
        input_folder = request.GET.get('folder')
        if os.path.exists(input_folder):
            media_folder = os.path.join(os.curdir, 'picture_organizer', 'static', 'media')
            for file_name in os.listdir(media_folder):  # Clean the media folder
                os.remove(os.path.join(media_folder, file_name))

            for file_name in os.listdir(input_folder):  # Import the images
                full_file_name = os.path.join(input_folder, file_name)
                if os.path.isfile(full_file_name) and is_image(file_name):
                    local_file_path = os.path.join(media_folder, file_name)
                    shutil.copy(full_file_name, local_file_path)

                    # Create a thumbnail
                    im = Image.open(local_file_path)
                    im.thumbnail((1028, 1028))
                    thumbnail = "{}.thumbnail".format(os.path.splitext(file_name)[0])
                    im.save(os.path.join(media_folder, thumbnail), "JPEG")

                    # Send information back to the webpage
                    data.append({
                        'file_path': thumbnail,
                        'title': file_name
                    })
    return JSONResponse({'data': data})


def index(request):
    variables = {}
    return render_to_response('picture_organizer/index.html', RequestContext(request, variables))
