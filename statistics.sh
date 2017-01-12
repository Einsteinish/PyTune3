source /vol1/MySites/PyTune3/venv/bin/activate
/vol1/MySites/PyTune3/venv/bin/python /vol1/MySites/PyTune3/manage.py refresh_feeds --force
/vol1/MySites/PyTune3/venv/bin/python /vol1/MySites/PyTune3/manage.py collect_stats
/vol1/MySites/PyTune3/venv/bin/python /vol1/MySites/PyTune3/manage.py index_feeds
/vol1/MySites/PyTune3/venv/bin/python /vol1/MySites/PyTune3/manage.py collect_feedback

