PYTUNE.Views.Sidebar = Backbone.View.extend({
    
    el: '.NB-sidebar',
    
    events: {
        "click .NB-feeds-header-starred .NB-feedlist-collapse-icon": "collapse_starred_stories",
        "click .NB-feeds-header-starred": "open_starred_stories",
        "click .NB-feeds-header-read": "open_read_stories",
        "click .NB-feeds-header-river-sites": "open_river_stories",
        "click .NB-feeds-header-river-pytuneblogs .NB-feedlist-collapse-icon": "collapse_river_pytuneblog",
        "click .NB-feeds-header-river-pytuneblogs": "open_river_pytuneblogs_stories",
        "click .NB-feeds-header-river-global": "open_river_global_stories"
    },
    
    initialize: function() {},
    
    // ===========
    // = Actions =
    // ===========
    
    check_starred_collapsed: function(options) {
        options = options || {};
        var collapsed = _.contains(PYTUNE.Preferences.collapsed_folders, 'starred');
        
        if (collapsed) {
            this.show_collapsed_starred(options);
        }
        
        return collapsed;
    },
    
    show_collapsed_starred: function(options) {
        options = options || {};
        var $header = PYTUNE.reader.$s.$starred_header;
        var $folder = this.$('.NB-starred-folder');
        
        $header.addClass('NB-folder-collapsed');
        
        if (!options.skip_animation) {
            $header.addClass('NB-feedlist-folder-title-recently-collapsed');
            $header.one('mouseover', function() {
                $header.removeClass('NB-feedlist-folder-title-recently-collapsed');
            });
        } else {
            $folder.css({
                display: 'none',
                opacity: 0
            });
        }
    },
    
    check_river_pytuneblog_collapsed: function(options) {
        options = options || {};
        var show_folder_counts = PYTUNE.assets.preference('folder_counts');
        var collapsed = _.contains(PYTUNE.Preferences.collapsed_folders, 'river_pytuneblog');

        if (collapsed) {
            this.show_collapsed_river_pytuneblog_count(options);
        } else if (show_folder_counts) {
            this.show_counts(options);
        }
        
        return collapsed;
    },
    
    show_collapsed_river_pytuneblog_count: function(options) {
        options = options || {};
        var $header = PYTUNE.reader.$s.$river_pytuneblogs_header;
        var $counts = $('.feed_counts_floater', $header);
        var $river = $('.NB-feedlist-collapse-icon', $header);
        var $folder = this.$('.NB-socialfeeds-folder');
        
        $header.addClass('NB-folder-collapsed');
        $counts.remove();
        
        if (!options.skip_animation) {
            // $river.animate({'opacity': 0}, {'duration': options.skip_animation ? 0 : 100});
            $header.addClass('NB-feedlist-folder-title-recently-collapsed');
            $header.one('mouseover', function() {
                $river.css({'opacity': ''});
                $header.removeClass('NB-feedlist-folder-title-recently-collapsed');
            });
        } else {
            $folder.css({
                display: 'none',
                opacity: 0
            });
        }
        
        this.show_counts(options);
    },
    
    show_counts: function(options) {
        var $header = PYTUNE.reader.$s.$river_pytuneblogs_header;
        if (this.unread_count) {
            this.unread_count.destroy();
        }
        this.unread_count = new PYTUNE.Views.UnreadCount({
            collection: PYTUNE.assets.social_feeds
        }).render();
        var $counts = this.unread_count.$el;
        
        if (this.options.feedbar) {
            this.$('.NB-story-title-indicator-count').html($counts.clone());
        } else {
            $header.prepend($counts.css({
                'opacity': 0
            }));
        }
        $counts.animate({'opacity': 1}, {'duration': options.skip_animation ? 0 : 400});
    },
    
    hide_collapsed_river_pytuneblog_count: function() {
        var $header = PYTUNE.reader.$s.$river_pytuneblogs_header;
        var $counts = $('.feed_counts_floater', $header);
        var $river = $('.NB-feedlist-collapse-icon', $header);
        
        $counts.animate({'opacity': 0}, {
            'duration': 300 
        });
        
        $river.animate({'opacity': .6}, {'duration': 400});
        $header.removeClass('NB-feedlist-folder-title-recently-collapsed');
        $header.one('mouseover', function() {
            $river.css({'opacity': ''});
            $header.removeClass('NB-feedlist-folder-title-recently-collapsed');
        });
    },
    
    // ==========
    // = Events =
    // ==========
    
    open_starred_stories: function() {
        return PYTUNE.reader.open_starred_stories();
    },
    
    open_read_stories: function() {
        return PYTUNE.reader.open_read_stories();
    },
    
    open_river_stories: function() {
        return PYTUNE.reader.open_river_stories();
    },
    
    collapse_river_pytuneblog: function(e, options) {
        e.stopPropagation();
        options = options || {};
        
        var $header = PYTUNE.reader.$s.$river_pytuneblogs_header;
        var $folder = this.$('.NB-socialfeeds-folder');
        
        // Hiding / Collapsing
        if (options.force_collapse || 
            ($folder.length && 
             $folder.eq(0).is(':visible'))) {
            PYTUNE.assets.collapsed_folders('river_pytuneblog', true);
            $header.addClass('NB-folder-collapsed');
            $folder.animate({'opacity': 0}, {
                'queue': false,
                'duration': options.force_collapse ? 0 : 200,
                'complete': _.bind(function() {
                    this.show_collapsed_river_pytuneblog_count();
                    $folder.slideUp({
                        'duration': 270,
                        'easing': 'easeOutQuart'
                    });
                }, this)
            });
        } 
        // Showing / Expanding
        else if ($folder.length && 
                 (!$folder.eq(0).is(':visible'))) {
            PYTUNE.assets.collapsed_folders('river_pytuneblog', false);
            $header.removeClass('NB-folder-collapsed');
            if (!PYTUNE.assets.preference('folder_counts')) {
                this.hide_collapsed_river_pytuneblog_count();
            }
            $folder.css({'opacity': 0}).slideDown({
                'duration': 240,
                'easing': 'easeInOutCubic',
                'complete': function() {
                    $folder.animate({'opacity': 1}, {'queue': false, 'duration': 200});
                }
            });
        }
        
        return false;
    },
    
    collapse_starred_stories: function(e, options) {
        e.stopPropagation();
        options = options || {};
        
        var $header = PYTUNE.reader.$s.$starred_header;
        var $folder = this.$('.NB-starred-folder');
        
        // Hiding / Collapsing
        if (options.force_collapse || 
            ($folder.length && 
             $folder.eq(0).is(':visible'))) {
            PYTUNE.assets.collapsed_folders('starred', true);
            $header.addClass('NB-folder-collapsed');
            $folder.animate({'opacity': 0}, {
                'queue': false,
                'duration': options.force_collapse ? 0 : 200,
                'complete': _.bind(function() {
                    this.show_collapsed_starred();
                    $folder.slideUp({
                        'duration': 270,
                        'easing': 'easeOutQuart'
                    });
                }, this)
            });
        } 
        // Showing / Expanding
        else if ($folder.length && 
                 (!$folder.eq(0).is(':visible'))) {
            PYTUNE.assets.collapsed_folders('starred', false);
            $header.removeClass('NB-folder-collapsed');
            $folder.css({'opacity': 0}).slideDown({
                'duration': 240,
                'easing': 'easeInOutCubic',
                'complete': function() {
                    $folder.animate({'opacity': 1}, {'queue': false, 'duration': 200});
                }
            });
        }
        
        return false;
    },
    
    open_river_pytuneblogs_stories: function() {
        return PYTUNE.reader.open_river_pytuneblogs_stories();
    },
    
    open_river_global_stories: function() {
        return PYTUNE.reader.open_river_pytuneblogs_stories({'global': true});
    }
    
});