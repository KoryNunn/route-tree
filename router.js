var arrayProto = [],
    formatRegex = /\{[0-9]*?\}/g;

function formatString(string, values) {
    return string.replace(/{(\d+)}/g, function (match, number) {
        return (values[number] == undefined || values[number] == null) ? match : values[number];
    }).replace(/{(\d+)}/g, "");
};

function Router(routes){
    this.routes = routes;
}
Router.prototype.find = function(path){
    var routeKeys = Object.keys(this.routes);

    for(var i = 0; i < routeKeys.length; i++) {
        if(path.match('^' + routeKeys[i].replace(formatRegex, '.*?') + '$')){
            return this.routes[routeKeys[i]];
        }
    }
};
Router.prototype.upOne = function(path){
    if(!path){
        return;
    }

    if(path === true){
        path = window.location.pathname;
    }

    var route = this.find(
            path.split('/')
            .slice(0, -1)
            .join('/')
        ),
        currentPathKeys = path.split('/'),
        upOnePath = this.get(route),
        upOneKeys;

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

    return upOneKeys.join('/');
};
Router.prototype.get = function(name){
    var route;

    for(var key in this.routes){
        if(this.routes[key] === name){
            route = key;
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

module.exports = Router;