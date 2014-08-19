var intersect = require('./intersect'),
    arrayProto = [],
    absolutePath = /^.+?\:\/\//g,
    formatRegex = /\{.*?\}/g,
    keysRegex = /\{(.*?)\}/g,
    nonNameKey = /^_(.*)$/,
    sanitiseRegex = /[#-.\[\]-^?]/g;

function sanitise(string){
    return string.replace(sanitiseRegex, '\\$&');
}

function formatString(string, values) {
    values || (values = {});

    return string.replace(/{(.+?)}/g, function (match, number) {
        return (values[number] === undefined || values[number] === null) ? '' : values[number];
    });
}

function resolve(rootPath, path){
    if(!path){
        return rootPath;
    }
    if(path.match(absolutePath)){
        return path;
    }
    return rootPath + path;
}

function Router(routes){
    this.basePath  = window.location.protocol + '//' + window.location.host;
    this.routes = routes;
    this.homeRoute = 'home';
}

function scanRoutes(routes, fn){
    var route,
        routeKey,
        result;

    for(var key in routes){
        if(key.charAt(0) === '_'){
            continue;
        }

        // Scan children first
        result = scanRoutes(routes[key], fn);
        if(result != null){
            return result;
        }
        // Scan current route
        result = fn(routes[key], key);
        if(result != null){
            return result;
        }
    }
}

Router.prototype.details = function(url){
    var router = this;

    if(url == null){
        url = window.location.href;
    }

    return scanRoutes(this.routes, function(route, routeName){
        var urls = Array.isArray(route._url) ? route._url : [route._url],
            bestMatch,
            mostMatches = 0;

        for(var i = 0; i < urls.length; i++){
            var routeKey = router.resolve(router.basePath, urls[i]),
                match = url.match('^' + sanitise(routeKey).replace(formatRegex, '(.*?)') + '$');

            if(match && match.length > mostMatches){
                mostMatches = match.length;
                bestMatch = routeKey;
            }
        }

        if(!bestMatch){
            return;
        }

        return {
            path: url,
            name: routeName,
            template: bestMatch
        };
    });
};

Router.prototype.info = function(name){
    var router = this;

    return scanRoutes(this.routes, function(route, routeName){
        if(routeName !== name){
            return;
        }

        var info = {
            name: routeName
        };

        for(var key in route){
            var keyNameMatch = key.match(nonNameKey);
            if(keyNameMatch){
                info[keyNameMatch[1]] = route[key];
            }
        }

        return info;
    });
};

Router.prototype.find = function(url){
    var details = this.details(url);

    return details && details.name;
};

Router.prototype.upOneName = function(name){
    if(!name){
        return;
    }

    return scanRoutes(this.routes, function(route, routeName){
        if(name in route){
            return routeName;
        }
    }) || this.homeRoute;
};

Router.prototype.upOne = function(path){
    if(path === undefined){
        path = window.location.href;
    }

    return this.drill(path, this.upOneName(this.find(path)));
};

function cleanTokens(token){
    return token.slice(1,-1);
}

Router.prototype.getRouteTemplate = function(name, values){
    var keys = values && typeof values === 'object' && Object.keys(values) || [];
        routeTemplate = scanRoutes(this.routes, function(route, routeName){
        if(name === routeName){
            var result = {
                route: route
            };

            if(!Array.isArray(route._url)){
                result.template = route._url;
                return result;
            }

            var urlsByDistance = route._url.slice().sort(function(urlA, urlB){
                var keysA = (urlA.match(keysRegex) || []).map(cleanTokens),
                    keysB = (urlB.match(keysRegex) || []).map(cleanTokens),
                    commonAKeys = intersect(keysA, keys),
                    commonBKeys = intersect(keysB, keys),
                    aDistance = Math.abs(commonAKeys.length - keys.length),
                    bDistance = Math.abs(commonBKeys.length - keys.length);

                return aDistance - bDistance;
            });

            result.template = urlsByDistance[0] || route._url[0];

            return result;
        }
    });

    if(!routeTemplate){
        return;
    }

    routeTemplate.template = this.resolve(this.basePath, routeTemplate.template);

    return routeTemplate;
};

Router.prototype.getTemplate = function(name, values){
    return this.getRouteTemplate(name, values).template;
};

Router.prototype.get = function(name, values){
    var routeTemplate = this.getRouteTemplate(name, values);

    if(!routeTemplate){
        return null;
    }

    values || (values = {});

    if(routeTemplate.route._defaults){
        for(var key in routeTemplate.route._defaults){
            var defaultValue = routeTemplate.route._defaults[key];
            if(typeof defaultValue === 'function'){
                defaultValue = defaultValue();
            }
            values[key] || (values[key] = defaultValue);
        }
    }

    return formatString(routeTemplate.template, values);
};

Router.prototype.isIn = function(childName, parentName){
    var currentRoute = childName,
        lastRoute;

    while(currentRoute !== lastRoute && currentRoute !== parentName){
        lastRoute = currentRoute;
        currentRoute = this.upOneName(currentRoute);
    }

    return currentRoute === parentName;
};

Router.prototype.isRoot = function(name){
    return name in this.routes;
};

Router.prototype.values = function(path){
    var details = this.details.apply(this, arguments),
        result = {},
        keys,
        values;

    if(details == null || details.template == null){
        return;
    }

    keys = details.template.match(keysRegex);
    values = details.path.match('^' + sanitise(details.template).replace(formatRegex, '(.*?)') + '$');

    if(keys && values){
        keys = keys.map(function(key){
            return key.slice(1,-1);
        });
        values = values.slice(1);
        for(var i = 0; i < keys.length; i++){
            result[keys[i]] = values[i];
        }
    }

    return result;
};

Router.prototype.drill = function(path, route, newValues){
    if(path == null){
        path = window.location.href;
    }


    var getArguments = this.values(path);

    if(newValues){
        for(var key in newValues){
            getArguments[key] = newValues[key];
        }
    }

    return this.get(route, getArguments);
};

Router.prototype.resolve = resolve;

module.exports = Router;