#!/usr/bin/env python 
from utils.munin.base import MuninGraph


class NBMuninGraph(MuninGraph):

    @property
    def graph_config(self):
        return {
            'graph_category' : 'PyTune',
            'graph_title' : 'PyTune Stories',
            'graph_vlabel' : 'Stories',
            'graph_args' : '-l 0',
            'stories.label': 'Stories',
            'starred_stories.label': 'Starred stories',
        }

    def calculate_metrics(self):
        from apps.rss_feeds.models import MStory, MStarredStory

        return {
            'stories': MStory.objects.count(),
            'starred_stories': MStarredStory.objects.count(),
        }

if __name__ == '__main__':
    NBMuninGraph().run()
