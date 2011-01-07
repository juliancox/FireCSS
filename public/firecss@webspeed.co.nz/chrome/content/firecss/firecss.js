FBL.ns(function() {
    with (FBL) {

        const HOST = 'http://192.168.123.51:3000'; //need to make this a option in firebug
        const PATH = 'firecss';
        const VERSION = 0.0

        var isFireCSSPage = null;
        var FireCSSContext = null;
        var FireCSSQueue = [];
        var FireCSSTimeout = null;
        var ModCounter = 0;
        var pageLocation = null;

        var scriptCode = function(url) {
            var result = "\
	        var script = document.createElement('script');\
	        script.src = '" + url + "';\
	        var head = document.getElementsByTagName('head')[0];\
	        head.appendChild(script);\
			";
            return result;
        }
	
        var loadScript = function(url) {
            var code = scriptCode(url);
            Firebug.CommandLine.evaluateInWebPage(code,FireCSSContext);
        }

        var fireCSSToServer = function() {
            if (FireCSSQueue.length > 0) {
                var args = '';
                for (var i = 0; i < FireCSSQueue.length; i++) {
                    args =  args + '&selectors[]=' + escape(FireCSSQueue[i].selector);
                    args =  args + '&properties[]=' + escape(FireCSSQueue[i].property);
                    args =  args + '&values[]=' + escape(FireCSSQueue[i].value);
                    args =  args + '&sources[]=' + escape(FireCSSQueue[i].source);
                    args =  args + '&lines[]=' + escape(FireCSSQueue[i].line);
                    args =  args + '&timestamps[]=' + escape(FireCSSQueue[i].timestamp);
                    args =  args + '&edits[]=' + escape(FireCSSQueue[i].edit);
                }
                FireCSSQueue = [];
                var url = HOST + '/' + PATH + '?v=' + VERSION + args;
                loadScript(url);
            }
        }

        var addCSSToQueue = function(selector, name, value, source, line) {
            clearTimeout(FireCSSTimeout);
            var cssObject = {
                selector: selector,
                property: name,
                value: value,
                source: source,
                line: line,
                timestamp: new Date().getTime(),
                edit: ModCounter
            }
            ModCounter = ModCounter + 1;
            Firebug.Console.log('FireCSS! '+ selector + ' {'+name+': '+value+'}');
            FireCSSQueue.push(cssObject);
            FireCSSTimeout = setTimeout(fireCSSToServer,2000);
        }

        var getPath = function(node, path) {
            path = path || [];
            if(node.parentNode) {
                path = getPath(node.parentNode, path);
            }

            if(node.previousSibling) {
                var count = 1;
                var sibling = node.previousSibling
                do {
                    if(sibling.nodeType == 1 && sibling.nodeName == node.nodeName) {
                        count++;
                    }
                    sibling = sibling.previousSibling;
                } while(sibling);
                if(count == 1) {
                    count = null;
                }
            } else if(node.nextSibling) {
                var sibling = node.nextSibling;
                do {
                    if(sibling.nodeType == 1 && sibling.nodeName == node.nodeName) {
                        var count = 1;
                        sibling = null;
                    } else {
                        var count = null;
                        sibling = sibling.previousSibling;
                    }
                } while(sibling);
            }

            if(node.nodeType == 1) {
                path.push(node.nodeName.toLowerCase() + (node.id ? "#"+node.id : count > 0 ? ":nth-child("+count+")" : ''));
            }
            return path;
        };


        function CSSListener()
        {
        }

        CSSListener.prototype =
        {
            onBeginEdit: function(panel, editor, target, value) {},
            onSaveEdit: function(panel, editor, target, value, oldValue) {
                if ((isFireCSSPage) && (target.className.indexOf('cssPropValue') >= 0)) {
                    // FireCSS is enabled for this page and a CSSValue has changed
                    // Now extract the value and the other pertinant details
                    var value = target.innerHTML;
                    var name = target.parentNode.getElementsByClassName('cssPropName')[0].innerHTML;
                    var selector = target.parentNode.parentNode.parentNode.parentNode.getElementsByClassName('cssSelector')[0].innerHTML;
                    var source = pageLocation;
                    var line = 0;
                    var link = target.parentNode.parentNode.parentNode.parentNode.parentNode.getElementsByClassName('objectLink')[0].repObject;
                    if (link) {
                        source = link.href;
                        line = link.line;
                    }
                    if (selector == 'element.style') {
                        var htmlPanel = FireCSSContext.getPanel("html",true);
                        var path = getPath(htmlPanel.selection).join(' > ');
                        selector = path;
                    }
                    addCSSToQueue(selector, name, value, source, line);
                /*
                    var htmlPanel = FireCSSContext.getPanel("html",true);
                    var item = htmlPanel.treeWalker
                    Firebug.Console.log("**** PANEL ****");
                    for (i in item) {
                        Firebug.Console.log(i+': '+item[i]);
                    }
                    Firebug.Console.log("**** END {ANEL ****");
                    item = htmlPanel.selection
                    Firebug.Console.log("**** PANEL ****");
                    for (i in item) {
                        Firebug.Console.log(i+': '+item[i]);
                    }
                    Firebug.Console.log("**** END {ANEL ****");
                    var arr = getPath(htmlPanel.selection);
                    Firebug.Console.log(arr.join(' > '));
 		Firebug.Console.log("**** PANEL ****");
		for (i in panel) {
				Firebug.Console.log(i+': '+panel[i])
		}
		Firebug.Console.log("**** END PANEL ****");
		Firebug.Console.log("**** EDITOR ****");
		for (i in editor) {
				Firebug.Console.log(i+': '+editor[i])
		}
		Firebug.Console.log("**** END EDITOR ****");
                     */
                // Firebug.Console.log("**** TARGET ****");
                // for (i in target) {
                //     Firebug.Console.log(i+': '+target[i]);
                // }
                // Firebug.Console.log("**** END TARGET ****");
                /*
                    Firebug.Console.log(target.className);
                    Firebug.Console.log("**** TARGET ****");
                    Firebug.Console.log(target.innerHTML);
                    Firebug.Console.log("**** END TARGET ****");
                    Firebug.Console.log("**** PARENT ****");
                    Firebug.Console.log(target.parentNode.innerHTML);
                    Firebug.Console.log("**** END PARENT ****");
                    Firebug.Console.log("**** GRANDPARENT ****");
                    Firebug.Console.log(target.parentNode.parentNode.innerHTML);
                    Firebug.Console.log("**** END GRANFPARENT ****");
                    Firebug.Console.log("**** GREATGRANDPARENT ****");
                    Firebug.Console.log(target.parentNode.parentNode.parentNode.innerHTML);
                    Firebug.Console.log("**** END GREATGRANFPARENT ****");
                    Firebug.Console.log("**** GERATGREATGRANDPARENT ****");
                    Firebug.Console.log(target.parentNode.parentNode.parentNode.parentNode.innerHTML);
                    Firebug.Console.log("**** END GREATGREATGRANFPARENT ****");
                    Firebug.Console.log("**** GREATGERATGREATGRANDPARENT ****");
                    Firebug.Console.log(target.parentNode.parentNode.parentNode.parentNode.parentNode.innerHTML);
                    Firebug.Console.log("**** END GREATGREATGREATGRANFPARENT ****");
                    Firebug.Console.log("**** OWNERDOC ****");
                    Firebug.Console.log(target.ownerDocument.parentNode.innerHTML);
                    Firebug.Console.log("**** END OWNERDOC ****");
                     */
                // loadScript("http://localhost:3000/javascripts/test.js");
                /*
   		 		Firebug.Console.log("**** VALUE ****");
		for (i in value) {
				Firebug.Console.log(i+': '+value[i])
		}
		Firebug.Console.log("**** END VALUE ****");
		Firebug.Console.log("**** OLDVALUE ****");
		for (i in oldValue) {
				Firebug.Console.log(i+': '+oldValue[i])
		}
		Firebug.Console.log("**** END OLDVALUE ****");
                     */
                }
            }
        }

        Firebug.CSSEchoModule = extend(Firebug.Module,
        {
            initialize: function(owner)
            {
                Firebug.Module.initialize.apply(this, arguments);

                // Register NetMonitor listener
                this.cssListener = new CSSListener();
                Firebug.Editor.addListener(this.cssListener);
            },

            initContext: function(context, state) {
                FireCSSContext = context;
                var code = "window._FireCSSExtension = true";
                Firebug.CommandLine.evaluateInWebPage(code,FireCSSContext);
                ModCounter = 0;
                pageLocation = context.window.wrappedJSObject.location.href.split('?')[0];
            },

            loadedContext: function(context) {
                isFireCSSPage = (context.window.wrappedJSObject._isFireCSSPage == true);
            },

            shutdown: function()
            {
                Firebug.Module.shutdown.apply(this, arguments);

                // Unregister NetMonitor listener
                Firebug.Editor.removeListener(this.netListener);
            }
        });

        Firebug.registerModule(Firebug.CSSEchoModule);

        }
});