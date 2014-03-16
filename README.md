route-tree
===

An extremely simple named route matcher

## Usage

Initialise it:

    var Router = require('route-tree');

    module.exports = new Router({
        home:{
            _url: ['/', '/home'],
            groups{
                _url: '/groups',
                group:{
                    _url: '/groups/{0}',
                    user: {
                        _url: '/groups/{0}/users/{1}'
                    }
                },
                newGroup:{
                    _url: '/groups/new'
                }
            }
        }
    });

Use it:

### Find

Find the name of a route from a path.

    router.find('/groups/12/users/2');

    // Will return 'user'

    router.find('/');

    // Will return 'home'

    router.find('/home');

    // Will also return 'home'

### Get

Get or build a path from a route.

    router.get('groups');

    // Will return '/groups'

    router.get('user', 5, 2);

    // Will return '/groups/5/users/2'

### Up one

Take a path, lookup the associated route, and return a path one route up from it.

    router.upOne('/groups/12/users/2');

    // Will return '/groups/12'

### Up one name

Find the route up one from the passed route.

    router.upOneName('user');

    // Will return 'group'

### Values

Parse values out of a path:

    router.values('/groups/1/users/2');

    // Will return ['1','2']

### Drill

Drill down into a deeper path, using the values from a given path

    router.drill('/groups/1', 'user', 3);

    // Will return '/groups/1/users/3'


## Defaults

By default, route-tree will assume you have a default home route named 'home'

This can be overriden on the instance of your router:

    // Change the default home page name to be 'index'
    router.homeRoute = 'index';

route-tree will assume that your base path is window.location.host, you can override this if you want to have
'/route' like routes but not have that resove to the hostname:

    router.baseRoute = window.location.host + '/abc/123';
