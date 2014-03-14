var arrayProto = [],
    formatRegex = /\{[0-9]*?\}/g;

function formatString(string, values) {
    return string.replace(/{(\d+)}/g, function (match, number) {
        return (values[number] == undefined || values[number] == null) ? match : values[number];
    });
};

function resolve(rootPath, path){
    return rootPath + path;
}

function Router(routes){
    this.basePath  = window.location.host;
    this.routes = routes;
}

function scanRoutes(routes, fn){
    var route,
        routeKey,
        result;

    for(var key in routes){
        if(key === '_url'){
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

Router.prototype.find = function(url){
    var router = this;

    if(url == null){
        url = window.location.href;
    }

    return scanRoutes(this.routes, function(route, routeName){
        var urls = Array.isArray(route._url) ? route._url : [route._url];
        for(var i = 0; i < urls.length; i++){
            var routeKey = resolve(router.basePath, urls[i]);

            if(url.match('^' + routeKey.replace(formatRegex, '.*?') + '$')){
                return routeName;
            }
        }
    });
};

Router.prototype.upOneName = function(name){
    if(!name){
        return;
    }

    return scanRoutes(this.routes, function(route, routeName){
        if(name in route){
            return routeName;
        }
    });
};

Router.prototype.upOne = function(path){
    if(path === undefined){
        path = window.location.href;
    }

    return this.drill(path, this.upOneName(this.find(path)));
};

Router.prototype.get = function(name){
    var url = scanRoutes(this.routes, function(route, routeName){
        if(name === routeName){
            return Array.isArray(route._url) ? route._url[0] : route._url;
        }
    });

    if(!url){
        return;
    }

    if(arguments.length > 1){
        return resolve(this.basePath, formatString(url, arrayProto.slice.call(arguments, 1)));
    }

    return resolve(this.basePath, url);
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

Router.prototype.values = function(path){
    var routeTemplate = this.get(this.find(path)),
        results;

    if(routeTemplate == null){
        return;
    }

    results = path.match('^' + routeTemplate.replace(formatRegex, '(.*?)') + '$');

    if(results){
        return results.slice(1);
    }
};

Router.prototype.drill = function(path, route){
    if(path == null){
        path = window.location.href;
    }
    var newValues = arrayProto.slice.call(arguments, 2);

    var getArguments = this.values(path) || [];

    getArguments = getArguments.concat(newValues);

    getArguments.unshift(route);

    return this.get.apply(this, getArguments);
};

module.exports = Router;