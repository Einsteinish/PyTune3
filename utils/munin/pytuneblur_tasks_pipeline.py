#!/usr/bin/env python 
from utils.munin.base import MuninGraph

class NBMuninGraph(MuninGraph):

    @property
    def graph_config(self):
        graph = {
            'graph_category' : 'PyTune',
            'graph_title' : 'PyTune Task Pipeline',
            'graph_vlabel' : 'Feed fetch pipeline times',
            'graph_args' : '-l 0',
            'feed_fetch.label': 'feed_fetch',
            'feed_process.label': 'feed_process',
            'page.label': 'page',
            'icon.label': 'icon',
            'total.label': 'total',
        }
        return graph

    def calculate_metrics(self):
        return self.stats
    
    @property
    def stats(self):
        import datetime
        from django.conf import settings
        
        stats = settings.MONGOANALYTICSDB.nbanalytics.feed_fetches.aggregate([{
            "$match": {
                "date": {
                    "$gt": datetime.datetime.now() - datetime.timedelta(minutes=5),
                },
            },
        }, {
            "$group": {
                "_id":          1,
                "feed_fetch":   {"$avg": "$feed_fetch"},
                "feed_process": {"$avg": "$feed_process"},
                "page":         {"$avg": "$page"},
                "icon":         {"$avg": "$icon"},
                "total":        {"$avg": "$total"},
            },
        }])
        
        return stats['result'][0]
        

if __name__ == '__main__':
    NBMuninGraph().run()
