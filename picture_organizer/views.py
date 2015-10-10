from django.shortcuts import render_to_response
from django.template import RequestContext


def index(request):
    variables = {}
    return render_to_response('picture_organizer/index.html', RequestContext(request, variables))
