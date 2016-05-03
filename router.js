var intersect = require('./intersect'),
    arrayProto = [],
    absolutePath = /^.+?\:\/\//g,
    formatRegex = /\{.*?\}/g,
    keysRegex = /\{(.*?)\}/g,
    nonNameKey = /^_(.*)$/,
    sanitiseRegex = /[#-.\[\]-^?]/g,
    queryTokenMatch = /^{\?.*?}$|^{\\\?.*?}$/;

function sanitise(string){
    return string.replace(sanitiseRegex, '\\$&');
}

function isQueryKey(key){
    return key.match(/^\?.*?$/);
}

function isQueryToken(token){
    return token.match(queryTokenMatch);
}

function isRestKey(key){
    return key.match(/^.*?\.\.\.$/);
}

function isRestToken(token){
    return token.match(/^{.*?(?:\.\.\.)|(?:\\\.\\\.\\\.)}$/);
}

function formatString(string, values) {
    values || (values = {});

    return string.replace(/{(.+?)}/g, function (match, key) {
        if(isRestKey(key)){
            key = key.slice(0,-3);
        }
        if(isQueryKey(key)){
            key = key.slice(1);

            return values[key] ? '?' + querySerialise(values[key]) : '';
        }
        return (values[key] === undefined || values[key] === null) ? '' : values[key];
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

function Router(routes, location){
    if(!location){
        location = window.location;
    }

    this.location = location;
    this.basePath  = location.protocol + '//' + location.host;
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

Router.prototype.currentPath = function(){
    return this.location.href;
};

function splitUrlQuery(url){
    return url.split(/\?/);
}

Router.prototype.details = function(url){
    var router = this;

    if(url == null){
        url = this.currentPath();
    }

    var parts = splitUrlQuery(url),
        query = parts[1] || ''

    url = parts[0];

    return scanRoutes(this.routes, function(route, routeName){
        var urls = Array.isArray(route._url) ? route._url : [route._url],
            bestMatch,
            mostMatches = 0;

        for(var i = 0; i < urls.length; i++){
            var routeKey = router.resolve(router.basePath, urls[i]),
                regex = '^' + sanitise(routeKey).replace(formatRegex, function(token){
                    if(isRestToken(token)){
                        return '(.*?)';
                    }
                    if(isQueryToken(token)){
                        return '';
                    }
                    return '([^/]*?)';
                }) + '$',
                match = url.match(regex);

            if(match && match.length > mostMatches){
                mostMatches = match.length;
                bestMatch = routeKey;
            }
        }

        if(bestMatch == null){
            return;
        }

        if(!query){
            bestMatch = bestMatch.replace(formatRegex, function(token){
                return isQueryToken(token) ? '' : token;
            });
        }

        return {
            query: query,
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
        path = this.currentPath();
    }

    return this.drill(path, this.upOneName(this.find(path)));
};

function cleanTokens(token){
    return token.slice(1,-1);
}

Router.prototype.getRouteTemplate = function(name, values){
    var keys = values && typeof values === 'object' && Object.keys(values) || [],
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

function getDefaults(defaults, result){
    for(var key in defaults){
        var defaultValue = defaults[key];

        if(typeof defaultValue === 'function'){
            defaultValue = defaultValue();
        }

        result[key] || (result[key] = defaultValue);
    }

    return result;
}

Router.prototype.get = function(name, values){
    var routeTemplate = this.getRouteTemplate(name, values);

    if(!routeTemplate){
        return null;
    }

    values || (values = {});

    if(routeTemplate.route._defaults){
        getDefaults(routeTemplate.route._defaults, values);
    }

    var serialise = routeTemplate.route._serialise;

    var resolvedValues = {};

    for(var valuesKey in values) {
        var value = values[valuesKey];

        resolvedValues[valuesKey] = serialise ?
            serialise(valuesKey, value) :
            value;
    }

    return formatString(routeTemplate.template, resolvedValues);
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

function querySerialise(value) {
    return Object.keys(value).reduce(function(result, key){
        result.push(key + '=' + value[key]);

        return result;
    }, []).join('&');

}

function queryDeserialise(value) {
    return value.split('&').reduce(function(result, part) {
        var parts = part.split('=');

        result[parts[0]] = parts[1];

        return result;
    }, {});
}

Router.prototype.values = function(path){
    var details = this.details.apply(this, arguments),
        result = {},
        keys,
        values;

    if(details == null || details.template == null){
        return;
    }

    var valueRegex = '^' + sanitise(details.template)
        .replace(formatRegex, function(match){
            if(isQueryToken(match)){
                return '';
            }
            return '(.*?)';
        }) + '$';

    keys = details.template.match(keysRegex);
    values = details.path
        .match(valueRegex);

    var info = this.info(details.name);

    if(keys && values){
        values = values.slice(1);

        keys.forEach(function(key, index){
            if(isQueryToken(key)){
                key = key.slice(2,-1);

                if(details.query){
                    result[key] = queryDeserialise(details.query);
                }


                return;
            }

            if(isRestToken(key)){
                key = key.slice(1,-4);
            } else{
                key = key.slice(1,-1);
            }

            var value = values[index];

            if(info.deserialise) {
                value = info.deserialise(key, value);
            }

            result[key] = value;
        });

        getDefaults(info.defaults, result);
    }

    return result;
};

Router.prototype.drill = function(url, route, newValues){
    if(url == null){
        url = this.currentPath();
    }


    var getArguments = this.values(url);

    if(newValues){
        for(var key in newValues){
            getArguments[key] = newValues[key];
        }
    }

    return this.get(route, getArguments);
};

Router.prototype.resolve = resolve;

module.exports = Router;
