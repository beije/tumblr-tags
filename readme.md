# Tumblr tags

A small script that fetches all the tags for a tumblr-blog. The script doesn't display anything, but instead returns an array of the tags and how many times each tags has been used (so you can style it however you want).

[Here's a live demo.][1]

## How to use

Include the script ```src/tumblrTags.js```. Once the document is ready you can fetch the tags for a tumblr user.

```sh
// Create a TumblrTags object, set the username of the blog.
var tagFetcher = new window.TumblrTags(username);

// Hook in to the ready event.
// The anonomous function will be fired when all the tags are fetched.
tagFetcher.on(
'ready',
function(tags){
    // Do something with the tags
    console.log(tags);
}
);

// Load posts
tagFetcher.load();
```

[1]: http://rawgit.com/beije/tumblr-tags/master/example/index.html
