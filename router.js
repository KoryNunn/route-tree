{
    '/patients/new':'newPatient',
    '/patients/.*?/results': 'results',
    '/patients/.*?': 'patient',
    '/': 'patients'
}

function Router(routes){
    this.routes = routes;
}
function find(route){
    var routeKeys = Object.keys(this.routes);

    for(var i = 0; i < routeKeys.length; i++) {
        if(route.match(routeKeys[i])){
            return this.routes[routeKeys[i]];
        }
    }
};
Router.prototype.upOne = function(){
    var location = window.location.pathname,
        keys = location.split('/').pop(),
        oneUp = keys.join('/');

    return this.find(oneUp);
};

module.exports = Router;