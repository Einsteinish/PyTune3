PYTUNE.Models.Comment = Backbone.Model.extend({
    
    urlRoot: '/social/comment',
    
    initialize: function() {
        this.bind('change:replies', this.changes_replies);
        this.bind('change:comments', this.strip_html_in_comments);
        this.changes_replies();
    },
    
    changes_replies: function() {
        if (this.get('replies')) {
            this.replies = new PYTUNE.Collections.CommentReplies(this.get('replies'));
        }
    },
    
    strip_html_in_comments: function() {
        this.attributes['comments'] = this.strip_html(this.get('comments'));
    },
    
    strip_html: function(html) {
        return html.replace(/<\/?[^>]+(>|$)/g, "");
    }

    
});

PYTUNE.Collections.Comments = Backbone.Collection.extend({
    
    url: '/social/comments',
    
    model: PYTUNE.Models.Comment
    
});

PYTUNE.Models.CommentReply = Backbone.Model.extend({
    
    stripped_comments: function() {
        return PYTUNE.Models.Comment.prototype.strip_html(this.get('comments'));
    }
    
});

PYTUNE.Collections.CommentReplies = Backbone.Collection.extend({
    
    model: PYTUNE.Models.CommentReply
    
});