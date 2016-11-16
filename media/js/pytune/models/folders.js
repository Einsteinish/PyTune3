PYTUNE.Models.FeedOrFolder = Backbone.Model.extend({
    
    initialize: function(model) {
        if (_.isNumber(model) || model['feed_id']) {
            this.feed = PYTUNE.assets.feeds.get(model['feed_id'] || model);

            // The feed needs to exists as a model as well. Otherwise, toss it.
            if (this.feed) {
                this.set('is_feed', true);
            }
        } else if (model && model.fake) {
            this.folders = model.folders;
        } else if (model) {
            var title = _.keys(model)[0];
            var children = model[title];
            this.set('is_folder', true);
            this.set('folder_title', title);
            this.folder_views = [];
            this.folders = new PYTUNE.Collections.Folders([], {
                title: title,
                parent_folder: this.collection,
                parse: true
            });
            this.folders.reset(_.compact(children), {parse: true});
        }
    },
    
    parse: function(attrs) {
        if (_.isNumber(attrs)) {
            attrs = {'feed_id': attrs};
        }
        return attrs;
    },
    
    is_feed: function() {
        return !!this.get('is_feed');
    },
    
    is_folder: function() {
        return !!this.get('is_folder');
    },
    
    get_view: function($folder) {
        var view = _.detect(this.folder_views, function(view) {
            if ($folder) {
                return view.el == $folder.get(0);
            }
        });
        if (!view && this.folders.length) {
            view = this.folders.get_view($folder);
        }
        return view;
    },
    
    feed_ids_in_folder: function(include_inactive) {
        if (this.is_feed() && (include_inactive || (!include_inactive && this.feed.get('active')))) {
            return this.feed.id;
        } else if (this.is_folder()) {
            return this.folders.feed_ids_in_folder(include_inactive);
        }
    },
    
    feeds_with_unreads: function(options) {
        if (this.is_feed()) {
            return this.feed.has_unreads(options) && this.feed;
        } else if (this.is_folder()) {
            return this.folders.feeds_with_unreads(options);
        }
    },
    
    move_to_folder: function(to_folder, options) {
        options = options || {};
        var view = options.view || this.get_view();
        var in_folder = this.collection.options.title;
        var folder_title = this.get('folder_title');
        if (in_folder == to_folder) return false;
        
        PYTUNE.reader.flags['reloading_feeds'] = true;
        PYTUNE.assets.move_folder_to_folder(folder_title, in_folder, to_folder, function() {
            PYTUNE.reader.flags['reloading_feeds'] = false;
            _.delay(function() {
                PYTUNE.reader.$s.$feed_list.css('opacity', 1).animate({'opacity': 0}, {
                    'duration': 100, 
                    'complete': function() {
                        PYTUNE.app.feed_list.make_feeds();
                    }
                });
            }, 250);
        });
        
        return true;
    },
    
    rename: function(new_folder_name) {
        var folder_title = this.get('folder_title');
        var in_folder = this.collection.options.title;
        PYTUNE.assets.rename_folder(folder_title, new_folder_name, in_folder);
        this.set('folder_title', new_folder_name);
    },
    
    delete_folder: function() {
        var folder_title = this.get('folder_title');
        var in_folder = this.collection.options.title;
        var feed_ids_in_folder = this.feed_ids_in_folder();
        
        PYTUNE.reader.flags['reloading_feeds'] = true;
        PYTUNE.assets.delete_folder(folder_title, in_folder, feed_ids_in_folder, function() {
            PYTUNE.reader.flags['reloading_feeds'] = false;
        });
        this.trigger('delete');
    },
    
    has_unreads: function(options) {
        options = options || {};

        if (options.include_selected && this.get('selected')) {
            return true;
        }
        
        return this.folders.has_unreads(options);
    },

    rss_url: function(filter) {
        return this.folders.rss_url(filter);
    },
    
    view_setting: function(setting) {
        if (this.is_folder()) {
            return PYTUNE.assets.view_setting('river:' + this.get('folder_title'), setting);
        } else {
            return PYTUNE.assets.view_setting(this.id, setting);
        }
    }
    
});

PYTUNE.Collections.Folders = Backbone.Collection.extend({
    
    options: {
        title: ''
    },
    
    initialize: function(models, options) {
        _.bindAll(this, 'propagate_feed_selected');
        this.options = _.extend({}, this.options, options);
        this.parent_folder = options && options.parent_folder;
        this.comparator = PYTUNE.Collections.Folders.comparator;
        this.bind('change:feed_selected', this.propagate_feed_selected);
        this.bind('change:counts', this.propagate_change_counts);
        this.bind('reset', this.reset_folder_views);
    },
    
    model: PYTUNE.Models.FeedOrFolder,
    
    reset_folder_views: function() {
        this.each(function(item) {
            if (item.is_feed()) {
                item.feed.views = [];
                item.feed.folders = [];
            }
        });        
    },
    
    folders: function() {
        return this.select(function(item) {
            return item.is_folder();
        });
    },
    
    find_folder: function(folder_name) {
        var found_folder;
        this.any(function(folder) {
            if (folder.is_folder()) {
                if (folder.get('folder_title').toLowerCase() == folder_name ||
                    folder.get('folder_title').toLowerCase().replace(/-/g, ' ') == folder_name) {
                    found_folder = folder;
                    return found_folder;
                }
                found_folder = folder.folders.find_folder(folder_name);
                return found_folder;
            }
        });
        return found_folder;
    },
    
    get_view: function($folder) {
        var view;
        this.any(function(item) {
            if (item.is_folder()) {
                view = item.get_view($folder);
                return view;
            }
        });
        if (view) {
            return view;
        }
    },
    
    child_folder_names: function() {
        var names = [];
        this.each(function(item) {
            if (item.is_folder()) {
                names.push(item.get('folder_title'));
                _.each(item.folders.child_folder_names(), function(name) {
                    names.push(name);
                });
            }
        });
        return names;
    },
    
    parent_folder_names: function() {
        var names = [this.options.title];
        if (this.parent_folder) {
            var parents = _.compact(_.flatten(this.parent_folder.parent_folder_names()));
            names = names.concat(parents);
        }
        
        return names;
    },
    
    feed_ids_in_folder: function(include_inactive) {
        return _.compact(_.flatten(this.map(function(item) {
            return item.feed_ids_in_folder(include_inactive);
        })));
    },
    
    feeds_with_unreads: function(options) {
        options = options || {};
        
        return _.compact(_.flatten(this.map(function(item) {
            return item.feeds_with_unreads(options);
        })));
    },
    
    selected: function() {
        var selected_folder;
        this.any(function(folder) {
            if (folder.is_folder()) {
                if (folder.get('selected')) {
                    selected_folder = folder;
                    return selected_folder;
                }
                selected_folder = folder.folders.selected();
                return selected_folder;
            }
        });
        return selected_folder;
    },
    
    deselect: function() {
        this.each(function(item) {
            if (item.is_folder()) {
                item.set('selected', false);
                item.folders.deselect();
            }
        });
    },
    
    unread_counts: function(sum_total, seen_feeds) {
        if (!seen_feeds) seen_feeds = [];
        var counts = this.reduce(function(counts, item) {
            if (item.is_feed() && !_.contains(seen_feeds, item.feed.id) && item.feed.get('active')) {
                var feed_counts = item.feed.unread_counts();
                counts['ps'] += feed_counts['ps'];
                counts['nt'] += feed_counts['nt'];
                counts['ng'] += feed_counts['ng'];
                seen_feeds.push(item.feed.id);
            } else if (item.is_folder()) {
                var folder_counts = item.folders.unread_counts(false, seen_feeds);
                counts['ps'] += folder_counts['ps'];
                counts['nt'] += folder_counts['nt'];
                counts['ng'] += folder_counts['ng'];
            }
            return counts;
        }, {
            ps: 0,
            nt: 0,
            ng: 0
        });
        
        this.counts = counts;
        
        if (sum_total) {
            var unread_view = PYTUNE.reader.get_unread_view_name();
            if (unread_view == 'positive') return counts['ps'];
            if (unread_view == 'neutral')  return counts['ps'] + counts['nt'];
            if (unread_view == 'negative') return counts['ps'] + counts['nt'] + counts['ng'];
        }
        return counts;
    },
    
    has_unreads: function(options) {
        options = options || {};
        
        return this.any(function(item) {
            if (item.is_feed()) {
                return item.feed.has_unreads(options);
            } else if (item.is_folder()) {
                return item.has_unreads(options);
            }
        });
    },
    
    propagate_feed_selected: function() {
        if (this.parent_folder) {
            this.parent_folder.trigger('change:feed_selected');
        }
    },

    propagate_change_counts: function() {
        if (this.parent_folder) {
            this.parent_folder.trigger('change:counts');
        }
    },
    
    update_all_folder_visibility: function() {
        this.each(function(item) {
            if (item.is_folder()) {
                item.folders.trigger('change:counts');
                item.folders.update_all_folder_visibility();
            }
        });
    },
    
    rss_url: function(filter) {
        var url = PYTUNE.URLs['folder_rss'];
        url = url.replace('{user_id}', PYTUNE.Globals.user_id);
        url = url.replace('{secret_token}', PYTUNE.Globals.secret_token);
        url = url.replace('{unread_filter}', filter);
        url = url.replace('{folder_title}', Inflector.sluggify(this.options.title));
        console.log(['rss_url', this]);
        
        return "https://" + PYTUNE.URLs.domain + url;
    },
    
    view_setting: function(setting) {
        return PYTUNE.assets.view_setting('river:' + (this.get('folder_title') || ''), setting);
    }

}, {

    comparator: function(modelA, modelB) {
        // toUpperCase for historical reasons
        var sort_order = PYTUNE.assets.preference('feed_order').toUpperCase();
        
        if (PYTUNE.Collections.Folders.organizer_sortorder) {
            sort_order = PYTUNE.Collections.Folders.organizer_sortorder.toUpperCase();
        }
        var high = 1;
        var low = -1;
        if (PYTUNE.Collections.Folders.organizer_inversesort) {
            high = -1;
            low = 1;
        }
        
        if (modelA.is_feed() != modelB.is_feed()) {
            // Feeds above folders
            return modelA.is_feed() ? -1 : 1;
        }
        if (modelA.is_folder() && modelB.is_folder()) {
            // Folders are alphabetical
            return modelA.get('folder_title').toLowerCase() > modelB.get('folder_title').toLowerCase() ? 1 : -1;
        }
        
        var feedA = modelA.feed;
        var feedB = modelB.feed;
        
        if (!feedA || !feedB) {
            return !feedA ? 1 : -1;
        }
        
        if (sort_order == 'ALPHABETICAL' || !sort_order) {
            return feedA.get('feed_title').toLowerCase() > feedB.get('feed_title').toLowerCase() ? high : low;
        } else if (sort_order == 'MOSTUSED') {
            return feedA.get('feed_opens') < feedB.get('feed_opens') ? high : 
                (feedA.get('feed_opens') > feedB.get('feed_opens') ? low : 
                (feedA.get('feed_title').toLowerCase() > feedB.get('feed_title').toLowerCase() ? high : low));
        } else if (sort_order == 'RECENCY') {
            return feedA.get('last_story_seconds_ago') < feedB.get('last_story_seconds_ago') ? high : 
                (feedA.get('last_story_seconds_ago') > feedB.get('last_story_seconds_ago') ? low : 
                (feedA.get('feed_title').toLowerCase() > feedB.get('feed_title').toLowerCase() ? high : low));            
        } else if (sort_order == 'FREQUENCY') {
            return feedA.get('average_stories_per_month') < feedB.get('average_stories_per_month') ? high : 
                (feedA.get('average_stories_per_month') > feedB.get('average_stories_per_month') ? low : 
                (feedA.get('feed_title').toLowerCase() > feedB.get('feed_title').toLowerCase() ? high : low)); 
        } else if (sort_order == 'SUBSCRIBERS') {
            return feedA.get('num_subscribers') < feedB.get('num_subscribers') ? high : 
                (feedA.get('num_subscribers') > feedB.get('num_subscribers') ? low : 
                (feedA.get('feed_title').toLowerCase() > feedB.get('feed_title').toLowerCase() ? high : low)); 
        }
    }

});