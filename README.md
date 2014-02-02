route-tree
===

An extremely simple named route matcher

## Usage

Initialise it:

    var Router = require('route-tree');

    module.exports = new Router({
        '/': 'home',
        '/groups': 'groups',
        '/groups/{0}': 'group',
        '/groups/{0}/users/{1}': 'user',
        '/groups/new': 'newGroup'
    });

Use it:

### Find

Find the name of a route from a path.

    router.find('/groups/12/users/2');

    // Will return 'groups'

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