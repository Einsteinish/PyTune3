PYTUNE.Views.StoryTitlesView = Backbone.View.extend({
    
    el: '.NB-story-titles',
    
    events: {
        "click .NB-feed-story-premium-only a" : function(e) {
            e.preventDefault();
            PYTUNE.reader.open_feedchooser_modal({premium_only: true});
        }
    },
    
    initialize: function() {
        _.bindAll(this, 'scroll');
        this.collection.bind('reset', this.render, this);
        this.collection.bind('add', this.add, this);
        this.collection.bind('no_more_stories', this.check_premium_river, this);
        this.collection.bind('no_more_stories', this.check_premium_search, this);
        this.collection.bind('change:selected', this.scroll_to_selected_story, this);
        PYTUNE.reader.$s.$story_titles.scroll(this.scroll);
        this.stories = [];
    },
    
    // ==========
    // = Render =
    // ==========
    
    render: function() {
        this.clear();
        PYTUNE.reader.$s.$story_titles.scrollTop(0);
        var collection = this.collection;
        var stories = this.collection.map(function(story) {
            return new PYTUNE.Views.StoryTitleView({
                model: story,
                collection: collection,
                is_grid: PYTUNE.assets.view_setting(PYTUNE.reader.active_feed, 'layout') == 'grid'
            }).render();
        });
        this.stories = stories;
        var $stories = _.map(stories, function(story) {
            return story.el;
        });
        this.$el.html($stories);
        this.end_loading();
        this.fill_out();
        this.override_grid();
        
        this.scroll_to_selected_story();
    },
    
    add: function(options) {
        var collection = this.collection;
        if (options.added) {
            var stories = _.compact(_.map(this.collection.models.slice(-1 * options.added), function(story) {
                if (story.story_title_view) return;
                return new PYTUNE.Views.StoryTitleView({
                    model: story,
                    collection: collection,
                    is_grid: PYTUNE.assets.view_setting(PYTUNE.reader.active_feed, 'layout') == 'grid'
                }).render();
            }));
            this.stories = this.stories.concat(stories);
            var $stories = _.map(stories, function(story) {
                return story.el;
            });
            this.$el.append($stories);
        }
        this.end_loading();
        this.fill_out();
    },

    clear: function() {
        _.invoke(this.stories, 'destroy');
        this.cache = {};
    },
    
    override_grid: function() {
        if (!PYTUNE.reader.active_feed) return;
        if (PYTUNE.assets.view_setting(PYTUNE.reader.active_feed, 'layout') != 'grid') return;
        var columns = PYTUNE.assets.preference('grid_columns');
        var $layout = PYTUNE.reader.$s.$story_titles;
        $layout.removeClass('NB-grid-columns-1')
               .removeClass('NB-grid-columns-2')
               .removeClass('NB-grid-columns-3')
               .removeClass('NB-grid-columns-4');

        if (columns > 0) {
            $layout.addClass('NB-grid-columns-' + columns);
        }
    },
    
    append_river_premium_only_notification: function() {
        var message = [
            'The full River of News is a ',
            $.make('a', { href: '#', className: 'NB-splash-link' }, 'premium feature'),
            '.'
        ];
        if (PYTUNE.reader.flags['starred_view']) {
            message = [
                'Reading saved stories by tag is a ',
                $.make('a', { href: '#', className: 'NB-splash-link' }, 'premium feature'),
                '.'
            ];
        }
        if (PYTUNE.reader.active_feed == "read") {
            message = [
                'This read stories list is a ',
                $.make('a', { href: '#', className: 'NB-splash-link' }, 'premium feature'),
                '.'
            ];
        }
        var $notice = $.make('div', { className: 'NB-feed-story-premium-only' }, [
            $.make('div', { className: 'NB-feed-story-premium-only-text'}, message)
        ]);
        this.$('.NB-feed-story-premium-only').remove();
        this.$(".NB-end-line").append($notice);
    },
    
    append_search_premium_only_notification: function() {
        var $notice = $.make('div', { className: 'NB-feed-story-premium-only' }, [
            $.make('div', { className: 'NB-feed-story-premium-only-text'}, [
                'Search is a ',
                $.make('a', { href: '#', className: 'NB-splash-link' }, 'premium feature'),
                '.'
            ])
        ]);
        this.$('.NB-feed-story-premium-only').remove();
        this.$(".NB-end-line").append($notice);
    },
    
    // ===========
    // = Actions =
    // ===========
    
    fill_out: function(options) {
        this.snap_back_scroll_position();
        
        if (PYTUNE.assets.flags['no_more_stories'] || 
            !PYTUNE.assets.stories.length ||
            PYTUNE.reader.flags.story_titles_closed) {
            return;
        }
        
        options = options || {};
        
        if (PYTUNE.reader.counts['page_fill_outs'] < PYTUNE.reader.constants.FILL_OUT_PAGES && 
            !PYTUNE.assets.flags['no_more_stories']) {
            // var $last = this.$('.NB-story-title:visible:last');
            // var container_height = PYTUNE.reader.$s.$story_titles.height();
            // PYTUNE.log(["fill out", $last.length && $last.position().top, container_height, $last.length, PYTUNE.reader.$s.$story_titles.scrollTop()]);
            PYTUNE.reader.counts['page_fill_outs'] += 1;
            _.delay(_.bind(function() {
                this.scroll();
            }, this), 10);
        } else {
            this.show_no_more_stories();
        }
    },
    
    show_loading: function(options) {
        options = options || {};
        if (PYTUNE.assets.flags['no_more_stories']) return;

        var $story_titles = PYTUNE.reader.$s.$story_titles;
        this.$('.NB-end-line').remove();
        var $endline = $.make('div', { className: "NB-end-line NB-short" });
        $endline.css({'background': '#E1EBFF'});
        $story_titles.append($endline);
        
        $endline.animate({'backgroundColor': '#5C89C9'}, {'duration': 650})
                .animate({'backgroundColor': '#E1EBFF'}, 1050);
        this.feed_stories_loading = setInterval(function() {
            $endline.animate({'backgroundColor': '#5C89C9'}, {'duration': 650})
                    .animate({'backgroundColor': '#E1EBFF'}, 1050);
        }, 1700);
        
        if (options.scroll_to_loadbar) {
            this.pre_load_page_scroll_position = $('#story_titles').scrollTop();
            if (this.pre_load_page_scroll_position > 0) {
                this.pre_load_page_scroll_position += $endline.outerHeight();
            }
            $story_titles.stop().scrollTo($endline, { 
                duration: 0,
                axis: 'y', 
                easing: 'easeInOutQuint', 
                offset: 0, 
                queue: false
            });
            this.post_load_page_scroll_position = $('#story_titles').scrollTop();
        } else {
            this.pre_load_page_scroll_position = null;
            this.post_load_page_scroll_position = null;
        }
    },
    
    check_premium_river: function() {
        if (!PYTUNE.Globals.is_premium &&
            PYTUNE.Globals.is_authenticated &&
            PYTUNE.reader.flags['river_view']) {
            this.show_no_more_stories();
            this.append_river_premium_only_notification();
        } else if (PYTUNE.assets.flags['no_more_stories']) {
            this.show_no_more_stories();
        }
    },
    
    check_premium_search: function() {
        if (!PYTUNE.Globals.is_premium &&
            PYTUNE.reader.flags.search) {
            this.show_no_more_stories();
            this.append_search_premium_only_notification();
        }
    },
    
    end_loading: function() {
        var $endbar = PYTUNE.reader.$s.$story_titles.find('.NB-end-line');
        $endbar.remove();
        clearInterval(this.feed_stories_loading);

        if (PYTUNE.assets.flags['no_more_stories']) {
            this.show_no_more_stories();
        }
    },
    
    show_no_more_stories: function() {
        this.$('.NB-end-line').remove();
        var $end_stories_line = $.make('div', { className: "NB-end-line" }, [
            $.make('div', { className: 'NB-fleuron' })
        ]);
        
        if (_.contains(['list', 'grid'], PYTUNE.assets.view_setting(PYTUNE.reader.active_feed, 'layout')) || PYTUNE.assets.preference('mark_read_on_scroll_titles')) {
            var pane_height = PYTUNE.reader.$s.$story_titles.height();
            var endbar_height = 20;
            var last_story_height = 80;
            endbar_height = pane_height - last_story_height;
            if (endbar_height <= 20) endbar_height = 20;

            var empty_space = pane_height - last_story_height - endbar_height;
            if (empty_space > 0) endbar_height += empty_space + 1;
            
            endbar_height /= 2; // Splitting padding between top and bottom
            $end_stories_line.css('paddingBottom', endbar_height);
            $end_stories_line.css('paddingTop', endbar_height);
            // console.log(["endbar height list", endbar_height, empty_space, pane_height, last_story_height]);
        }

        this.$el.append($end_stories_line);
    },
    
    snap_back_scroll_position: function() {
        var $story_titles = PYTUNE.reader.$s.$story_titles;
        if (this.post_load_page_scroll_position == $story_titles.scrollTop() &&
            this.pre_load_page_scroll_position != null &&
            !PYTUNE.reader.flags['select_story_in_feed']) {
            $story_titles.stop().scrollTo(this.pre_load_page_scroll_position, { 
                duration: 0,
                axis: 'y', 
                offset: 0, 
                queue: false
            });
        }
    },
    
    // ============
    // = Bindings =
    // ============
    
    scroll_to_selected_story: function(story, options) {
        options = options || {};
        var story_title_view = (story && story.story_title_view) ||
                                (this.collection.active_story && this.collection.active_story.story_title_view);
        if (!story_title_view) return;
        if (story && 
            !story.get('selected') && 
            !options.force && 
            PYTUNE.assets.view_setting(PYTUNE.reader.active_feed, 'layout') != 'grid') return;
            
        // console.log(["scroll_to_selected_story 1", story, options]);
        var story_title_visisble = PYTUNE.reader.$s.$story_titles.isScrollVisible(story_title_view.$el);
        if (!story_title_visisble || options.force || 
            _.contains(['list', 'grid'], PYTUNE.assets.view_setting(PYTUNE.reader.active_feed, 'layout'))) {
            var container_offset = PYTUNE.reader.$s.$story_titles.position().top;
            var scroll = story_title_view.$el.find('.NB-story-title').position().top;
            if (options.scroll_to_comments) {
                scroll = story_title_view.$el.find('.NB-feed-story-comments').position().top;
            }
            var container = PYTUNE.reader.$s.$story_titles.scrollTop();
            var height = PYTUNE.reader.$s.$story_titles.outerHeight();
            var position = scroll+container-height/5;
            // console.log(["scroll_to_selected_story 2", container_offset, scroll, container, height, position]);
            if (_.contains(['list', 'grid'], PYTUNE.assets.view_setting(PYTUNE.reader.active_feed, 'layout'))) {
                position = scroll+container;
            }
            if (PYTUNE.assets.view_setting(PYTUNE.reader.active_feed, 'layout') == 'grid') {
                position += 21;
            }
            
            // console.log(["scroll_to_selected_story 3", position]);
            PYTUNE.reader.$s.$story_titles.stop().scrollTo(position, {
                duration: PYTUNE.assets.preference('animations') ? 260 : 0,
                queue: false
            });
        }    
    },
    
    // ==========
    // = Events =
    // ==========
    
    scroll: function() {
        var $story_titles = PYTUNE.reader.$s.$story_titles;
        var scroll_y = $story_titles.scrollTop();

        if (PYTUNE.reader.flags['opening_feed']) return;
        if (PYTUNE.assets.preference('mark_read_on_scroll_titles')) {
            this.mark_read_stories_above_scroll(scroll_y);
        }
        if (PYTUNE.assets.flags['no_more_stories']) return;
        
        var container_offset = $story_titles.position().top;
        var visible_height = $story_titles.height() * 2;
        var total_height = this.$el.outerHeight() + PYTUNE.reader.$s.$feedbar.innerHeight();
        
        // console.log(["scroll titles", container_offset, visible_height, scroll_y, total_height, this.$el]);
        if (visible_height + scroll_y >= total_height) {
            PYTUNE.reader.load_page_of_feed_stories({scroll_to_loadbar: false});
        }
    },
    
    mark_read_stories_above_scroll: function(scroll_y) {
        var $story_titles = PYTUNE.reader.$s.$story_titles;
        var score = PYTUNE.reader.get_unread_view_score();
        var unread_stories = [];
        var grid = PYTUNE.assets.view_setting(PYTUNE.reader.active_feed, 'layout') == 'grid';
        var point = PYTUNE.reader.$s.$story_titles.offset();
        var offset = grid ? {top: 100, left: 100} : {top: 30, left: 30};
        var $story_title = $(document.elementFromPoint(point.left + offset.left, 
                                                       point.top + offset.top
                           )).closest('.'+PYTUNE.Views.StoryTitleView.prototype.className);
        var reached_bottom = PYTUNE.assets.flags['no_more_stories'] && 
                             this.$el.height() - $story_titles.height() - scroll_y <= 0;
        var topstory = _.detect(this.stories, function(view) {
            if (!reached_bottom && view.el == $story_title[0]) return true;
            if (view.model.get('read_status') == 0 && view.model.score() >= score) {
                unread_stories.push(view.model);
            }
        });
        if (!topstory && !reached_bottom) {
            // console.log(['no closest', topstory, $story_title[0], document.elementFromPoint(offset.left + 20, offset.top + 20)]);
            return;
        }
        // console.log(['closest', $story_title[0], topstory && topstory.model.get('story_title'), unread_stories]);
        _.invoke(unread_stories, 'mark_read');
    }
    
});