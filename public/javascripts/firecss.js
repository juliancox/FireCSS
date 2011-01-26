(function() {

    var PATH = '/firecss/polling';
    window._isFireCSSPage = true; //enable the FireCSS firebug extension

    if (false) { // (window._FireCSSExtension) { // (window.console && window.console.firebug) {
        // window._isFireCSSPage = true; //enable the FireCSS firebug extension
        console.log('firecss server');
    } else {
        //this is one of the other clients of register for push updates and act on them
        
        var insertAfter = function(newElement,targetElement) {
            var parent = targetElement.parentNode;
            if(parent.lastchild == targetElement) {
                parent.appendChild(newElement);
            } else {
                parent.insertBefore(newElement, targetElement.nextSibling);
            }
        }

        var mySrc = function() {
            var scripts = document.getElementsByTagName('script');
            for (var i = 0; i < scripts.length; i++) {
                var src = scripts[i].getAttribute('src');
                if (src.indexOf('/firecss.js') > 0) {
                    return src;
                }
            }
            return null;
        }

        var insertionPoints = {};
        var lastEdit = -1;

        //get all style tags so we can find out where to insert inline and document stuff
        //we do this before examining links because we're going to add style tags then
        var styles = document.getElementsByTagName('style');
        var el = document.createElement('style');
        if (styles.length > 0) {
            insertAfter(el, styles[styles.length - 1]);
        } else {
            document.getElementsByTagName('head')[0].appendChild(el);
        }
        insertionPoints[window.location.href] = el;

        var links = document.getElementsByTagName('link'); //find all links so we can work out where the stylesheets are
        for (var i = 0; i < links.length; i++) {
            var link = links[i];
            if (link.getAttribute('rel') == 'stylesheet') {
                var href = link.getAttribute('href');
                var tag = document.createElement('style');
                insertAfter(tag, link)
                insertionPoints[href] = tag;
            }
        }

        processUpdate = function(data) {
            if (data) {
                for (var i = 0; i < data.length; i++) {
                    var css = data[i];
                    var rule = css.selector+' {'+css.property+': '+css.value+'}\n';
       
                     try {
                        insertionPoints[css.source].innerHTML = insertionPoints[css.source].innerHTML + rule;
                    } catch(exc) {
                        insertionPoints[css.source].styleSheet.addRule(css.selector, css.property+': '+css.value);
                    }
                    if (css.edit > lastEdit) {
                        lastEdit = css.edit;
                    }
                }
            }
        }

        if (false) {
        // var pusherChannel = window.location.host + window.location.pathname.split('?')[0].replace('/','_');
        //var pusher = new Pusher('03cb0652f55212acc073',pusherChannel);
        // if (pusher.connection) {
        //    pusher.bind('FireCSS', processUpdate);
        } else {
            var location = mySrc();
            var host = location.split('://')[1].split('/')[0];
            var pollingUrl = 'http://' + host + PATH;
            var pollScript = document.createElement('script');
            pollScript.src = pollingUrl
            document.getElementsByTagName('head')[0].appendChild(pollScript);
            setInterval(function() {
                pollScript.parentNode.removeChild(pollScript);
                pollScript = document.createElement('script');
                pollScript.src = pollingUrl + '?callback=processUpdate&edit=' + lastEdit + '&timestamp=' + new Date().getTime();
                document.getElementsByTagName('head')[0].appendChild(pollScript);
            }, 1000);
        }
    }

})();
