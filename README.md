route-tree
===

An extremely simple named route matcher

## Usage

Initialise it:
```javascript

var Router = require('route-tree');

module.exports = new Router({
    home:{
        _url: ['/', '/home'],
        groups{
            _url: '/groups',
            group:{
                _url: '/groups/{groupId}',
                user: {
                    _url: '/groups/{groupId}/users/{userId}'
                }
            },
            newGroup:{
                _url: '/groups/new'
            }
        }
    },
    image: {
        _url: '/images/{path...}'
    },
    withQuery: {
        _url: '/foo{?query}'
    }
});
```
Use it:

### Find

Find the name of a route from a path.
```javascript

router.find('/groups/12/users/2');

// Will return 'user'

router.find('/');

// Will return 'home'

router.find('/home');

// Will also return 'home'

router.find('/withQuery');

// Will return 'withQuery'

router.find('/withQuery?a=1&b=2');

// Will also return 'withQuery'
```
### Get

Get or build a path from a route.
```javascript

router.get('groups');

// Will return '/groups'

router.get('user', {
    groupId: 5,
    userId: 2
});

// Will return '/groups/5/users/2'
```
Get a template for a given path.
```javascript

router.getTemplate('groups');

// Will return '/groups'

router.getTemplate('user', {
    groupId: 5,
    userId: 2
});

// Will return '/groups/{0}/users/{1}'
```
### Up one

Take a path, lookup the associated route, and return a path one route up from it.
```javascript

router.upOne('/groups/12/users/2');

// Will return '/groups/12'
```

### Up one name

Find the route up one from the passed route.
```javascript

router.upOneName('user');

// Will return 'group'
```

### isIn

Check if a route is a decendant of another route.
```javascript

router.isIn('user', 'home');

// Will return true

router.isIn('home', 'user');

// Will return false
```

### isRoot

Check if a route at the root of the router.
```javascript

router.isRoot('home');

// Will return true

router.isRoot('user');

// Will return false
```
### Values

Parse values out of a path:
```javascript

router.values('/groups/1/users/2');

// Will return { groupId: 1, userId: 2 }

router.values('/withQuery?a=1&b=2');

// Will return {query { a: 1, b: 2 }}
```

A route can also have a [serialise and deserialise values](#Serialise%20/%20Deserialise%20Values) function

### Drill

Drill down into a deeper path, using the values from a given path
```javascript

router.drill('/groups/1', 'user', {userId: 3});

// Will return '/groups/1/users/3'
```
## Tokens

Tokens can be put in routes in the format of ```{tokenName}```, which will match everything excluding slashes.

If you need to match everything *including* slashes, you can use the 'rest' token format: ```{tokenName...}```

## Defaults

You can specify default route-values with `_defaults`:

```javascript

new Router({
        foo:{
            _url: '/bar/{dooby}',
            _defaults: { dooby: 'whatsits' }
    }
})
```

By default, route-tree will assume you have a default home route named 'home'

This can be overriden on the instance of your router:
```javascript

// Change the default home page name to be 'index'
router.homeRoute = 'index';
```

route-tree will assume that your base path is window.location.host, you can override this if you want to have
'/route' like routes but not have that resove to the hostname:

```javascript

router.basePath = window.location.host + '/abc/123';
```

## Serialise / Deserialise Values

A route can have a \_serialise and \_deserialise function

```javascript
var router = new Router({
        home: {
            _url: '/home/{foo}',
             _serialise: function(key, value) {
                if(value && value instanceof Date){
                    return value.toISOString();
                }

                return value;
            },
            _deserialise: function(key, value) {
                if(value.match(dateRegex)){
                    return new Date(value);
                }

                return value;
            }
        }
    }
});
```
```javascript
router.get('home', {
        foo: new Date()
    });
```
Will return '/home/2000-01-31T14:00:00.000Z
```javascript
router.values(router.basePath + '/home/2000-01-31T14:00:00.000Z')
```
Will return:
```javascript
{
    foo: Tue Feb 01 2000 00:00:00 GMT+1000 (AEST)
}
```
