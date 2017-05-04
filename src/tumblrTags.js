(function(window, undefined) {
    window.TumblrTags = function(username) {
        this.callbacks = {
            'ready': []
        };

        this.username = '';
        this.domain = 'tumblr_tags';
        this.uniqueId = '';
        this.totalItems = -1;
        this.postOffset = 0;
        this.postsPerPage = 50;
        this.posts = [];
        this.tags = {};
        this.scriptCounter = 0;
        this.processed = 0;
        this.enqueued = 0;
        this.batchInterval = false;
        this.batchSize = 7;
        this.batchTimeoutInMs = 2000;

        /**
        * Initialize the tag fetcher.
        *
        * @param  {string} username The tumblr username.
        *
        * @return void.
        */
        this.initalize = function(username) {
            this.username = username;
            this.uniqueId = this.domain + '_' + Math.round(Math.random()*10000);
            window[this.uniqueId] = this.handleItems.bind(this);
        };

        /**
        * Starts loading all the scripts.
        *
        * @return void.
        */
        this.load = function() {
            if(!username) {
                throw new Error('Invalid username.');
            }

            this.totalItems = -1;
            this.postOffset = 0;
            this.postsPerPage = 50;

            this.enqueueScript();
        };

        /**
        * Callback handler for JSONP script.
        *
        * @param  {object} data The data from the JSONP script.
        *
        * @return void.
        */
        this.handleItems = function(data) {
            this.postOffset += data.posts.length;
            this.processed++;
            
            if(this.totalItems === -1) {
                this.totalItems = data['posts-total'];
            }

            if ((this.postOffset < this.totalItems) && this.processed == this.enqueued && this.batchInterval == false) {
                this.batchInterval = setTimeout(
                    this.runBatch.bind(this),
                    this.batchTimeoutInMs
                )
            }

            this.posts = this.posts.concat(data.posts);

            if(this.postOffset >= this.totalItems) {
                this.fetchTags(this.posts);
                this.removeScriptTags();
                this.executeCallback('ready', [this.getTags()]);
            }
        };

        /**
        * Runs a batch of requests
        *
        * @return void.
        */
        this.runBatch = function() {
            var pages = Math.ceil(this.totalItems / this.postsPerPage);
            var start = this.processed;
            var end = this.processed + this.batchSize;
            
            end = (end*this.postsPerPage > this.totalItems ? Math.ceil(this.totalItems/this.postsPerPage) : end);

            for(var i = start; i < end; i++) {
                this.enqueueScript(this.postsPerPage, i*this.postsPerPage);
            }

            this.batchInterval = false;
        }

        /**
        * Removes all script tags added by this script.
        *
        * @return void.
        */
        this.removeScriptTags = function() {
            var scripts = document.querySelectorAll("[id*='" + this.uniqueId + "-']");
            for(var i = 0; i < scripts.length; i++) {
                scripts[i].parentNode.removeChild(scripts[i]);
            }
        }

        /**
        * Fetches all tags from an array of posts.
        *
        * @param  {array} posts Posts to fetch tags from.
        *
        * @return void.
        */
        this.fetchTags = function(posts) {
            for(var i = 0; i < posts.length; i++) {
                var post = this.posts[i];
                if(post.tags) {
                    for(var n = 0; n < post.tags.length; n++) {
                        this.addTag(post.tags[n]);
                    }
                }
            }
        };

        /**
        * Adds a tag to the taglist (if tag already exists, add to hits counter)
        *
        * @param  {string} tag The tag
        *
        * @return void.
        */
        this.addTag = function(tag) {
            if(this.tags[tag]) {
                this.tags[tag].hits += 1;
            } else {
                this.tags[tag] = {
                    'tag': tag,
                    'hits': 1
                }
            }
        };

        /**
        * Fetches all tags from the blog.
        * (you need to run load() before calling this method)
        *
        * @return array.
        */
        this.getTags = function() {
            var tags = [];
            for(var prop in this.tags) {
                if(!this.tags.hasOwnProperty(prop)) {
                    continue;
                }

                tags.push(this.tags[prop]);
            }

            return tags;
        };

        /**
        * Enqueues a script to the body element.
        * (The script will be removed once everything has been loaded)
        *
        * @param  {int} limit Optional limit, default: 50, max: 50
        * @param  {int} offset Optional offset
        *
        * @return void.
        */
        this.enqueueScript = function(limit, offset) {
            limit = limit || this.postsPerPage;
            offset = offset || this.postOffset;
            
            this.enqueued++;

            var id = this.uniqueId + '-' + this.scriptCounter;
            var script = document.createElement('script');
            script.id = id;
            script.src = 'http://' + this.username + '.tumblr.com/api/read/json?callback=' + this.uniqueId + '&num=' + limit + '&start=' + offset;

            document.body.appendChild(script);
        };

        this.initalize(username);
    };

    /* Add event handling to the prototype of the tumblr tag handler */
    TumblrTags.prototype = {
        /**
        * Available callbacks. Should be overriden.
        * @type {Object}
        */
        callbacks: {},

        /**
        * Execute callbacks
        *
        * @param  {String} event The event type.
        * @param  {Array} args Optional arguments.
        *
        * @return void.
        */
        executeCallback: function(event, args) {
            if (!this.callbacks[event]) {
                throw new Error('Invalid event given. ' + String(event));
            }

            if (!args) {
                args = [];
            }

            for (var i in this.callbacks[event]) {
                if (!this.callbacks[event].hasOwnProperty(i)) continue;
                this.callbacks[event][i].apply(null, args);
            }
        },

        /**
        * Register callback
        *
        * @param  {String} event The event type.
        * @param  {function} callback The callback.
        * @param  {String} id Id of the callback.
        * @return void.
        */
        on: function(event, callback, id) {
            if (!this.callbacks[event]) {
                throw new Error('Invalid event given. ' + String(event));
            }
            if (!(callback instanceof Function)) {
                throw new Error('Invalid callback given.');
            }

            if (!id) {
                id = Math.random()*100000;
            }

            this.callbacks[event][id] = callback;
        },

        /**
        * Unregister callback
        *
        * @param  {String} event The event type.
        * @param  {String} id Id of the callback.
        * @return void.
        */
        off: function(event, id) {
            if (!this.callbacks[event]) {
                throw new Error('Invalid event given. ' + String(event));
            }

            var callbacks = [];

            for (var i in this.callbacks[event]) {
                if (!this.callbacks[event].hasOwnProperty(i)) continue;
                if (i == id) continue;
                callbacks[i] = this.callbacks[event][i];
            }

            this.callbacks[event] = callbacks;
        },
    };

})(window);
