from rest_framework.renderers import JSONRenderer
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponse


class JSONResponse(HttpResponse):

    def __init__(self, data, **kwargs):
        content = JSONRenderer().render(data)
        kwargs['content_type'] = 'application/json'
        super(JSONResponse, self).__init__(content, **kwargs)

    @classmethod
    def error(cls, code, msg):
        return JSONResponse({'status': code, 'error': msg})


def get_files(request):
    if request.GET.get('folder'):
        print request.GET.get('folder')
    return JSONResponse({'data': {}})


def index(request):
    variables = {}
    return render_to_response('picture_organizer/index.html', RequestContext(request, variables))
