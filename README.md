FireCSS
=======

With FireCSS you can edit html and css in Firebug for Firefox and see the changes as you edit.  Go to [http://firecss.com](http://firecss.com) for a video showing it in action


Warning
-------

This is an alpha release.  

Some key features are missing (which I've outlined below) and its reasonably untested except running locally on a single machine.

I've developed and tested it in Firefox 3.6.17 with Firebug 1.6.2 on a Mac.  I have no idea if it will work with other versions.  
I'd be surprised if it works in Firefox 4 and Firebug 1.7


Getting Started
---------------

You will need to be comfortable setting up a Ruby on Rails server to get this release running (eventually it's likely to be ported to node with a hosted option).  
I recommend Heroku.com if you are familiar with Git, unfamiliar with RoR and want to get a server up and running quickly.

There are three key parts to FireCSS:

### Firebug Plugin

The plugin monitors changes to your CSS and forwards it to the server.
It currently sits in the Public folder of the rails application: firecss@webspeed.co.nz

I haven't bothered to package the plugin up yet but It's easy to install:
1. In Firefox select Help menu:Troubleshooting Information
2. Click the 'Show in Finder' button beside Profile Directory
3. Open the highlighted folder in the finder and open the extensions folder within that
4. Copy the firecss@webspeed.co.nz folder to that extensions folder
5. Start or restart Firefox

If it is installed you will see two new FireCSS buttons in the Firebug menu bar


### Firecss Javascript

When you want to enable a page for editing through FireCSS you need to include the public/javascripts/firecss.js script

This script enables the FireCSS plugin within Firebug when running if Firefox and manages the polling for and displaying of CSS changes in other browsers

To keep it simple I don't bother checking for DOMContentLoaded so its best to include it at the bottom of the page.  See public/test.html for an example

The source of this script is used to determine where to send and retrieve updates so it must be served from the rails application.  
The html page itself can be hosted anywhere.


### FireCSS Server

The server handles incoming updates from the FireCSS plugin and farms the updates out to any copies of the page in other browsers through the polling that the javascript file initiates.
It also handles wrapping the changes into a zip file of sources when they are downloaded.

It's pretty simple - all handled by the index, polling, and download methods in the firecss controller.

Initially I tried using push updates through the pusher plugin to avoid polling - this proved too slow.  
I've left the code in place for now but other than using the pusher channel name no push updates are used.
Eventually I plan to use websockets where possible after porting to node.js


Editing
-------

Once you've installed the FireCSS plugin, started your RoR server, and added the script tag referencing the javascript file to the bottom of your html page...

Open the page in Firefox and another browser.
Note: that the page address is currently used to identify changes so all browsers need to have the same address for the page.  
If you are running locally on one machine you need to reference the page via an ip address that the other machine can reach - localhost will not work (its fine if all browsers are running on the same machine).

Open Firebug and start editing the CSS in the html or CSS panels.  You should be able to see the changes reflected in the other page almost immediately.

At any time you can reset your changes and revert to the original page.
The reset button is the Fireball heading right with a red cross in the Firebug toolbar.
When you click it all browsers should revert (it will take a couple of seconds for the Firefox version to update).

When you have finished editing click the Fireball heading left with a green tick to save your changes.
An HTML file (if there are no external CSS files) or zip archive (with the html source and css includes as separate files) will be downloaded.
You then need replace the original files on the origin server(s). Your original files will not be overwritten automatically.
 

Gotchas
-------

If you ferret around in the FireCSS javascript file you'll see that for each stylesheet link or style tag a shadow one is added immediately after to receive the updates.
For the non firefox clients, all updates will take precedence over all original CSS rules in that rule set.  In Firefox the updates will generally be to the original in the rule set.
This means you may well see some differences between the Firefox version and other browsers where precedence is an issue (watch our for the !important tag particularly).
On saving changes the current Firefox version is used so you should find your updates remain true to Firefox when your updated files are loaded in the other browsers.
This issue should be fixable.

Firefox will drop any tags it doesn’t understand.  When the updates are sent back to the server the downloaded files will only include the Mozilla rules.
I'm planning to incorporate a dictionary of equivalents into the server at some stage so that rules like -moz-border-radius will automatically get the webkit and other equivalents.


Missing features
----------------

A bonus in this version is that any HTML edits you make in Firebug to the page will be saved as part of the download.  
Unfortunately in this version changes to the HTML don't get updated in the other browser as they are made.  Only CSS changes.

There is no update channel password so anyone who loads the page while you're editing it (assuming they can load from the same address) will see your changes.

The FireCSS buttons are currently always visible and enabled in Firebug even if the page your viewing doesn't have the FireCSS javascript tag.

In the downloaded files all rules are formatted on a single line.  
It would be nice to add some formatting options so that the format of the update CSS files matched your preferences.

You can edit the same page in two different versions of Firefox with the Firebug and FireCSS plugins.  
Other browsers should reflect all changes but in this version each copy of Firefox will not be updated with the changes from the the other copy.
(The earlier version I used for the video on FireCSS.com did update from multiple sources).
