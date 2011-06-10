//    FireCSS - See CSS changes in all browsers as you edit
//    Copyright (C) 2011  Julian Cox, Webspeed Ltd.
//
//    This program is free software: you can redistribute it and/or modify
//    it under the terms of the GNU General Public License as published by
//    the Free Software Foundation, either version 3 of the License, or
//    (at your option) any later version.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//
//    You should have received a copy of the GNU General Public License
//    along with this program.  If not, see <http://www.gnu.org/licenses/>.

FBL.ns(function() {
    with (FBL) {

        const PATH = 'firecss';
        const VERSION = 0.0
        
        var host = null;

        var isFireCSSPage = null;
        var FireCSSContext = null;
        var FireCSSQueue = [];
        var FireCSSTimeout = null;
        var ModCounter = 0;
        var pageLocation = null;
        var dirty = false;

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
                var url = host + '/' + PATH + '?v=' + VERSION + args;
                loadScript(url);
                dirty = true;
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
            // Firebug.Console.log('FireCSS! '+ selector + ' {'+name+': '+value+'} ' + source + ' (line: ' + line + ')');
            FireCSSQueue.push(cssObject);
            FireCSSTimeout = setTimeout(fireCSSToServer,1000);
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

        var getAncestorByAttribute = function(element, name, value) {
            if (!element.parentNode || !element.parentNode.getAttribute) return null;
            var attr = element.parentNode.getAttribute(name)
            if (attr && (attr == value || (value.test && value.test(attr)))) return element.parentNode;
            return getAncestorByAttribute(element.parentNode,name,value);
        }

        var getAncestorByClassName = function(element, value) {
            return getAncestorByAttribute(element, 'class', new RegExp('(^|\\s)' + value + '($|\\s)'));
        }

        var ruleLineNo = function(element) {
            var lineNo = function(element) {
                var ruleid = element.getAttribute('ruleid').split('/');
                if (ruleid[0] == 'new') {
                    return  element.getAttribute('fcslineno');
                } else {
                    return ruleid[ruleid.length - 1];
                }
            }
            var prevLineNo = function(element) {
                if (!element.previousSibling) {
                    return 0
                } else {
                    var line = lineNo(element.previousSibling);
                    if (line) {
                        return line
                    } else {
                        return prevLineNo(element.previousSibling)
                    }
                }
            }
            var nextLineNo = function(element) {
                if (!element.nextSibling) {
                    return 9999999; // shouldn't be that number of lines in a single css file
                } else {
                    var line = lineNo(element.nextSibling);
                    if (line) {
                        return line
                    } else {
                        return nextLineNo(element.nextSibling)
                    }
                }
            }
            element = new RegExp('(^|\\s)cssRule($|\\s)').test(element.getAttribute('class')) ? element : getAncestorByClassName(element,'cssRule');
            var line = lineNo(element);
            if (line) {
                return line
            } else {
                var prev = parseFloat(prevLineNo(element));
                var postPrev = parseInt(prev) + 1
                var next = parseFloat(nextLineNo(element));
                if (next > postPrev) {
                    next = postPrev;
                }
                line = prev + ((next - prev)/2);
                element.setAttribute('fcslineno',line);
                return line;
            }
        }

        function CSSListener()
        {
        }

        CSSListener.prototype =
        {
            onBeginEdit: function(panel, editor, target, value) {},
            onSaveEdit: function(panel, editor, target, value, oldValue) {
                try {
                    if ((isFireCSSPage) && (target.className.indexOf('cssPropValue') >= 0)) {
                        FireCSSContext.window.wrappedJSObject.lastEdit = target;  // so we can explore the target and heirarchy in the firebug console
                        // FireCSS is enabled for this page and a CSSValue has changed
                        // Now extract the value and the other pertinant details
                        var value = target.innerHTML;
                        var rule = getAncestorByClassName(target,'cssRule');
                        var name = rule.getElementsByClassName('cssPropName')[0].innerHTML;
                        var selector = rule.getElementsByClassName('cssSelector')[0].innerHTML;
                        var ruleid = rule.getAttribute('ruleid').split('/');
                        var line = ruleLineNo(target)
                        var source = pageLocation;
                        if (target.ownerDocument.title == "Firebug Main Panel") {
                            source = panel.location.href;
                        } else if (target.ownerDocument.title == "Firebug Side Panel") {
                            line = 0;
                            var link = rule.parentNode.getElementsByClassName('objectLink')[0].repObject;
                            if (link && link.href) {
                                source = link.href;
                                line = link.line || 0;
                            }
                            if (selector == 'element.style') {
                                var htmlPanel = FireCSSContext.getPanel("html",true);
                                var path = getPath(htmlPanel.selection).join(' > ');
                                selector = path;
                            }
                        }
                        if (selector) {
                            addCSSToQueue(selector, name, value, source, line);
                        }
                    }
                } catch (e) {
                    Firebug.Console.log('FireCSS EXCEPTION: '+e.message+'\n'+e.stack)
                }
            }
        }

        Firebug.FireCSS = extend(Firebug.Module,
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
                if (isFireCSSPage) {
                    // find where the firecss script is coming from so we can post back to that location
                    var scripts = content.document.getElementsByTagName('script');
                    for (var i = 0; i < scripts.length; i++) {
                        var src = scripts[i].getAttribute('src');
                        if ((src) && (src.indexOf('/firecss.js') > 0)) {
                            var parts = src.split('://')
                            host = parts[0] + '://' +parts[1].split('/')[0];
                            break;
                        }
                    }
                 }
             },

            shutdown: function()
            {
                Firebug.Module.shutdown.apply(this, arguments);

                // Unregister NetMonitor listener
                Firebug.Editor.removeListener(this.netListener);
            },

            buttonFireCSSReset: function() {
                var doreset = ((!dirty) || (confirm('You have unsaved edits - are you sure you want to reset this page?')));
                if (doreset) {
                    args = "&edits[]=-1";
                    var url = host + '/' + PATH + '?v=' + VERSION + args;
                    loadScript(url);
                }
            },

            buttonFireCSSSave: function() {
               
                var form = content.document.getElementById('_FireCSSStyleForm');
                if (form) {
                    form.parentNode.removeChild(form);
                }
                form = content.document.createElement("form");
                form.setAttribute("id", '_FireCSSStyleForm');
                form.setAttribute("method", 'post');
                form.setAttribute("target", '_blank');
                form.setAttribute("action", host + '/firecss/download');
                var stylesheets = content.document.styleSheets;
                
                 var styleEls = content.document.getElementsByTagName('style');
                var styleElCount = 0;
                
                for (var i = 0; i < stylesheets.length; i++) { 
                    var rules = stylesheets[i].cssRules;
                    var css = ''
                    for (var j = 0; j < rules.length; j++) {
                        css += rules[j].cssText + "\n"
                    }
                    if (stylesheets[i].href) {
                        // its an external stylesheet we're going to send the contents up  
                        var sheet = content.document.createElement("input");
                        sheet.setAttribute("type", 'hidden');
                        sheet.setAttribute("name", 'stylesheets[]');
                        sheet.setAttribute("value", stylesheets[i].href);
                        form.appendChild(sheet);
                        var details = content.document.createElement("input");
                        details.setAttribute("type", 'hidden');
                        details.setAttribute("name", 'rules[]');
                        details.setAttribute("value", css);
                        form.appendChild(details);
                    } else {
                        // its an internal style tag - we're going to replace in the html and catch in the html content
                        // first check to see if it’s the firebug stylesheet - in which case remove it.
                        if ((rules.length > 0) && (rules[0].selectorText == '.firebugCanvas')) {
                            styleEls[styleElCount].parentNode.removeChild(styleEls[styleElCount]);
                        } else {
                            styleEls[styleElCount].innerHTML = css;
                        }
                        styleElCount++;
                    }
                }
                
                var html = content.document.createElement("input");
                html.setAttribute("type", 'hidden');
                html.setAttribute("name", 'html');
                var docContent = '<!DOCTYPE ' + content.document.doctype.name + ' PUBLIC "'+ content.document.doctype.publicId + '" "' + content.document.doctype.systemId + '">\n'
                docContent += '<html'
                for (var i=0; i < content.document.documentElement.attributes.length; i++) {
                    var attr = content.document.documentElement.attributes[i];
                    docContent+= ' ' + attr.name + '="' + attr.value + '"';
                }
                docContent += '>\n'
                docContent += content.document.documentElement.innerHTML
                docContent += '\n</html>'
                html.setAttribute("value",docContent);
                form.appendChild(html);
 
                content.document.body.appendChild(form);
                form.submit();
                dirty = false;
            }
        });

        Firebug.registerModule(Firebug.FireCSS);

        }
});