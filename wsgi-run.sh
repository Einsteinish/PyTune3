#!/bin/bash
uwsgi --http-socket :8787 --home /vol1/MySites/PyTune3/venv --chdir /vol1/MySites/PyTune3 -w wsgi

