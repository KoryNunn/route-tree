var arrayProto = [],
    formatRegex = /\{[0-9]*?\}/g;

function keysToPath(keys){
    if(keys.length === 1 && keys[0] === ''){
        return '/';
    }
    return keys.join('/');
}

function formatString(string, values) {
    return string.replace(/{(\d+)}/g, function (match, number) {
        return (values[number] == undefined || values[number] == null) ? match : values[number];
    }).replace(/{(\d+)}/g, "");
};

function Router(routes){
    this.routes = routes;
    this._names = {};
}
Router.prototype.find = function(path){
    if(path === undefined){
        path = window.location.pathname;
    }

    var routeKeys = Object.keys(this.routes);

    for(var i = 0; i < routeKeys.length; i++) {
        if(path.match('^' + routeKeys[i].replace(formatRegex, '.*?') + '$')){
            return this.routes[routeKeys[i]];
        }
    }
};
Router.prototype.upOneName = function(route){
    if(!route){
        return;
    }

    return this.find(this.upOne(this.get(route)));
};
Router.prototype.upOne = function(path){
    if(path === undefined){
        path = window.location.pathname;
    }

    if(!path){
        return;
    }

    var route,
        upOnePath,
        pathKeys = path.split('/'),
        currentPathKeys = path.split('/'),
        upOneKeys;

    while(!upOnePath && pathKeys.length){
        pathKeys.pop();
        route = this.find(
            keysToPath(pathKeys)
        ),
        upOnePath = this.get(route);
    }

    if(!upOnePath){
        // Nothing above current path.
        // Return current path.
        return path;
    }

    upOneKeys = upOnePath.split('/');

    for(var i = 0; i < upOneKeys.length; i++) {
        if(upOneKeys[i].match(formatRegex)){
            upOneKeys[i] = currentPathKeys[i];
        }
    }

    return keysToPath(upOneKeys);
};
Router.prototype.get = function(name){
    var route = this._names[name];

    if(route == null){
        for(var key in this.routes){
            if(this.routes[key] === name){
                this._names[name] = key;
                route = key;
            }
        }
    }

    if(route == null){
        return;
    }

    if(arguments.length > 1){
        return formatString(route, arrayProto.slice.call(arguments, 1));
    }

    return route;
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
        results = path.match('^' + routeTemplate.replace(formatRegex, '(.*?)') + '$');

    if(results){
        return results.slice(1);
    }
};

module.exports = Router;