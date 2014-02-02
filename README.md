Route-Tree
===

A simple tree-like named route matcher.


## Usage

Require:
    var Router = require('../');

Instantiate:
    router = new Router({
        '/majiggers':'majiggers',
        '/things/new':'newThing',
        '/things/{0}/stuff/{1}': 'aStuff',
        '/things/{0}': 'thing',
        '/things': 'things',
        '/': 'home'
    });

match a route:

    router.find('/things/5') -> 'thing'

etc..
    router.find('/things') -> 'things'
    router.find('/things/5/stuff/1') -> 'aStuff'

If no path is passed, the router will use window.location.pathname

up a level:

    router.upOne('/things/5/stuff/majigger') -> '/things/5'

get a route, built or not:

    router.get('home') -> '/'

No params:

    router.get('thing') -> '/things/{0}'

With params:

    router.get('thing', 1) -> '/things/1'

Check if a route is a descendant of another, or the same route:

    router.isIn('things', 'home') -> true
    router.isIn('thing', 'things') -> true
    router.isIn('majiggers', 'stuff') -> false
});

Parse values out of a path:

    router.values('/things/1/stuff/2') -> ['1','2']