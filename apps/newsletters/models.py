import datetime
import re
import redis
from cgi import escape
from django.db import models
from django.contrib.auth.models import User
from django.contrib.sites.models import Site
from django.core.urlresolvers import reverse
from django.conf import settings
from django.utils.html import linebreaks
from apps.rss_feeds.models import Feed, MStory, MFetchHistory
from apps.reader.models import UserSubscription, UserSubscriptionFolders
from apps.profile.models import Profile
from utils import log as logging
from utils.story_functions import linkify
from utils.scrubber import Scrubber

class EmailNewsletter:
    
    def receive_newsletter(self, params):
        user = self.user_from_email(params['recipient'])
        if not user:
            return
        
        sender_name, sender_username, sender_domain = self.split_sender(params['from'])
        feed_address = self.feed_address(user, "%s@%s" % (sender_username, sender_domain))
        
        usf = UserSubscriptionFolders.objects.get(user=user)
        usf.add_folder('', 'Newsletters')
        
        try:
            feed = Feed.objects.get(feed_address=feed_address)
        except Feed.DoesNotExist:
            feed = Feed.objects.create(feed_address=feed_address, 
                                       feed_link='http://' + sender_domain,
                                       feed_title=sender_name,
                                       fetched_once=True,
                                       known_good=True)
            feed.update()
            logging.user(user, "~FCCreating newsletter feed: ~SB%s" % (feed))
            r = redis.Redis(connection_pool=settings.REDIS_PUBSUB_POOL)
            r.publish(user.username, 'reload:%s' % feed.pk)
        
        if feed.feed_title != sender_name:
            feed.feed_title = sender_name
            feed.save()
        
        try:
            usersub = UserSubscription.objects.get(user=user, feed=feed)
        except UserSubscription.DoesNotExist:
            _, _, usersub = UserSubscription.add_subscription(
                user=user, 
                feed_address=feed_address,
                folder='Newsletters'
            )
        
        story_hash = MStory.ensure_story_hash(params['signature'], feed.pk)
        story_content = self.get_content(params)
        story_content = self.clean_content(story_content)
        story_params = {
            "story_feed_id": feed.pk,
            "story_date": datetime.datetime.fromtimestamp(int(params['timestamp'])),
            "story_title": params['subject'],
            "story_content": story_content,
            "story_author_name": params['from'],
            "story_permalink": "https://%s%s" % (
                                    Site.objects.get_current().domain,
                                    reverse('newsletter-story', 
                                            kwargs={'story_hash': story_hash})),
            "story_guid": params['signature'],
        }
        try:
            story = MStory.objects.get(story_hash=story_hash)
        except MStory.DoesNotExist:
            story = MStory(**story_params)
            story.save()
        
        usersub.needs_unread_recalc = True
        usersub.save()
        
        self.publish_to_subscribers(feed)
        
        MFetchHistory.add(feed_id=feed.pk, fetch_type='push')
        logging.user(user, "~FCNewsletter feed story: ~SB%s~SN / ~SB%s" % (story.story_title, feed))
        
        return story
        
    def user_from_email(self, email):
        tokens = re.search('(\w+)\+(\w+)@newsletters.pytune.com', email)
        if not tokens:
            return
        
        username, secret_token = tokens.groups()
        try:
            profiles = Profile.objects.filter(secret_token=secret_token)
            if not profiles:
                return
            profile = profiles[0]
        except Profile.DoesNotExist:
            return
        
        return profile.user
    
    def feed_address(self, user, sender):
        return 'newsletter:%s:%s' % (user.pk, sender)
    
    def split_sender(self, sender):
        tokens = re.search('(.*?) <(.*?)@(.*?)>', sender)

        if not tokens:
            name, domain = sender.split('@')
            return name, sender, domain
            
        sender_name, sender_username, sender_domain = tokens.group(1), tokens.group(2), tokens.group(3)
        sender_name = sender_name.replace('"', '')
        
        return sender_name, sender_username, sender_domain
    
    def get_content(self, params):
        if 'body-html' in params:
            return params['body-html']
        if 'stripped-html' in params:
            return linkify(linebreaks(params['stripped-html']))
        if 'body-plain' in params:
            return linkify(linebreaks(params['body-plain']))
    
    def clean_content(self, content):
        scrubber = Scrubber()
        content = scrubber.scrub(content)
        content = content.replace('!important', '')
        return content
        
    def publish_to_subscribers(self, feed):
        try:
            r = redis.Redis(connection_pool=settings.REDIS_PUBSUB_POOL)
            listeners_count = r.publish(str(feed.pk), 'story:new')
            if listeners_count:
                logging.debug("   ---> [%-30s] ~FMPublished to %s subscribers" % (feed.title[:30], listeners_count))
        except redis.ConnectionError:
            logging.debug("   ***> [%-30s] ~BMRedis is unavailable for real-time." % (feed.title[:30],))
        
    
