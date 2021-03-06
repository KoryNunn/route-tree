var dateRegex = require('regex-iso-date')();

if(!global.window){
    global.window = {
        location:{
            host: 'mysite.com'
        }
    };
}

var test = require('tape'),
    Router = require('../'),
    intersect = require('../intersect'),
    router = new Router({
        noUrl:{
            _url: ['']
        },
        home:{
            _url: ['/', '/index.html'],
            _something: 1234,
            majiggers:{
                _url: '/majiggers'
            },
            things:{
                _url: '/things',
                newThing:{
                    _url: '/things/new'
                },
                thing:{
                    _url: '/things/{0}',
                    aStuff:{
                        _url: ['/things/{0}/stuff/{1}', '/things/{0}/stuff/{1}/{2}']
                    }
                }
            }
        },
        login: {
            _url: '/login'
        },
        defaulted:{
            _url: '/defaulted/{0}/{1}',
            _defaults: ['a','b']
        },
        names:{
            _url: '/names/{first}/{second}',
            _defaults: {
                first: function(){
                    return 'wat';
                },
                second: 'b'
            }
        },
        keyOptions:{
            _url: ['/a','/a?b={b}']
        },
        bestFit:{
            _url: ['/bestFit','/bestFit/{a}', ,'/bestFit/{a}/{b}']
        },
        rest:{
            _url: ['/therest/{things...}']
        },
        queryToken: {
            _url: [
                '/queryToken{?query}',
                '/queryToken/{dooby}{?query}'
            ]
        }
    });

router.currentPath = function(){
    return '/someRoute';
}

router.basePath = '';

test('match a route', function(t){
    t.plan(6);

    t.equal(router.find('/things/5'), 'thing');
    t.equal(router.find('/things'), 'things');
    t.equal(router.find('/things/5/stuff/1'), 'aStuff');
    t.equal(router.find('/'), 'home');
    t.equal(router.find('/things/new'), 'newThing');
    t.equal(router.find('/stuff'), undefined);
});

test('up a level', function(t){
    t.plan(3);

    t.equal(router.upOne('/things/5/stuff/majigger'), '/things/5');
    t.equal(router.upOne('/things/5'), '/things');
    t.equal(router.upOne('/'), '/');
});

test('up by name', function(t){
    t.plan(1);

    t.equal(router.upOneName('aStuff'), 'thing');
});

test('get', function(t){
    t.plan(5);

    t.equal(router.get('home'), '/');
    t.equal(router.get('thing', [1]), '/things/1');
    t.equal(router.get('thing'), '/things/');
    t.equal(router.get('aStuff', [1, 2]), '/things/1/stuff/2');
    t.equal(router.get('aStuff', [1, 2, 3]), '/things/1/stuff/2/3');
});

test('get with defaults', function(t){
    t.plan(1);

    t.equal(router.get('defaulted'), '/defaulted/a/b');
});

test('get with partial defaults', function(t){
    t.plan(1);

    t.equal(router.get('defaulted', ['c']), '/defaulted/c/b');
});

test('values with defaults', function(t){
    t.plan(1);

    t.deepEqual(router.values('/defaulted//'), {0: 'a', 1: 'b'});
});

test('values with partial defaults', function(t){
    t.plan(1);

    t.deepEqual(router.values('/defaulted/c/'), {0: 'c', 1: 'b'});
});

test('get with names', function(t){
    t.plan(2);

    t.equal(router.get('names', {first:'c'}), '/names/c/b');
    t.equal(router.get('names'), '/names/wat/b');
});

test('getTemplate', function(t){
    t.plan(5);

    t.equal(router.getTemplate('home'), '/');
    t.equal(router.getTemplate('thing', [1]), '/things/{0}');
    t.equal(router.getTemplate('thing'), '/things/{0}');
    t.equal(router.getTemplate('aStuff', [1, 2]), '/things/{0}/stuff/{1}');
    t.equal(router.getTemplate('aStuff', [1, 2, 3]), '/things/{0}/stuff/{1}/{2}');
});

test('isIn', function(t){
    t.plan(3);

    t.ok(router.isIn('things', 'home'));
    t.ok(router.isIn('thing', 'things'));
    t.notOk(router.isIn('majiggers', 'stuff'));
});

test('isRoot', function(t){
    t.plan(3);

    t.ok(router.isRoot('home'));
    t.ok(router.isRoot('login'));
    t.notOk(router.isRoot('majiggers'));
});

test('values', function(t){
    t.plan(3);

    t.deepEqual(router.values('/things/1/stuff/2'), {'0':'1','1':'2'});
    t.deepEqual(router.values('/things/1/stuff/2/3'), {'0':'1','1':'2','2':'3'});
    t.deepEqual(router.values('/names/stuff/things'), {first:'stuff',second:'things'});
});

test('drill', function(t){
    t.plan(2);

    t.deepEqual(router.drill('/things/1', 'aStuff', {"1":2}), '/things/1/stuff/2');
    t.deepEqual(router.drill('/things/1', 'aStuff'), '/things/1/stuff/');
});

test('resolve', function(t){
    t.plan(2);

    t.deepEqual(router.resolve('http://a.b.c', '/a', [2]), 'http://a.b.c/a');
    t.deepEqual(router.resolve('http://a.b.c', 'http://d.e.f'), 'http://d.e.f');
});

test('multiple options', function(t){
    t.plan(2);

    t.deepEqual(router.get('keyOptions'), '/a');
    t.deepEqual(router.get('keyOptions', {b:1}), '/a?b=1');
});

test('intersect', function(t){
    t.plan(2);

    t.deepEqual(intersect([1,2,3], [2,3,4]), [2,3]);
    t.deepEqual(intersect([], [2,3,4]), []);
});

test('multiple options best fit', function(t){
    t.plan(4);

    t.deepEqual(router.get('bestFit'), '/bestFit');
    t.deepEqual(router.get('bestFit', {a:1, b: 2}), '/bestFit/1/2');
    t.deepEqual(router.get('bestFit', {b:1, c: 2}), '/bestFit//1');
    t.deepEqual(router.get('bestFit', {a:1, c: 2}), '/bestFit/1');
});

test('no named route', function(t){
    t.plan(1);

    t.equal(router.get('nothingForThis'), null);
});

test('info', function(t){
    t.plan(2);

    t.equal(router.info('home').something, 1234);
    t.deepEqual(router.info('home').url, ['/', '/index.html']);
});

test('rest', function(t){
    t.plan(2);

    t.equal(router.find('/therest/of/the/url'), 'rest');
    t.deepEqual(router.values('/therest/of/the/url').things, 'of/the/url');
});

test('get', function(t){
    t.plan(1);

    t.equal(router.get('rest', {'things':'stuff'}), '/therest/stuff');
});

test('queryToken', function(t){
    t.plan(12);

    t.equal(router.find('/queryToken'), 'queryToken');
    t.equal(router.find('/queryToken?foo=bar'), 'queryToken');

    t.deepEqual(router.values('/queryToken'), {});
    t.deepEqual(router.values('/queryToken?foo=bar'), {query: {foo: 'bar'}});

    t.equal(router.get('queryToken', {}), '/queryToken');
    t.equal(router.get('queryToken', {query: {foo: 'bar'}}), '/queryToken?foo=bar');

    t.equal(router.find('/queryToken/dooby'), 'queryToken');
    t.equal(router.find('/queryToken/dooby?foo=bar'), 'queryToken');

    t.deepEqual(router.values('/queryToken/dooby'), {dooby: 'dooby'});
    t.deepEqual(router.values('/queryToken/dooby?foo=bar'), {dooby: 'dooby', query: {foo: 'bar'}});

    t.equal(router.get('queryToken', {}), '/queryToken');
    t.equal(router.get('queryToken', {dooby: 'dooby', query: {foo: 'bar'}}), '/queryToken/dooby?foo=bar');
});

test('noUrl', function(t){
    t.plan(1);

    t.equal(router.find(''), 'noUrl');
});

test('custom currentPath', function(t){
    t.plan(5);

    var testUrl = '/#/users#/';
        routes = {
            home:{
                _url: '/',
                users: {
                    _url:'/users',
                    user:{
                        _url:'/users/{userId}'
                    }
                }
            }
        },
        router1 = new Router(routes),
        router2 = new Router(routes);

    router1.basePath = router2.basePath = '';
    router1.currentPath = function(){
        return testUrl.split('#').slice(1)[0];
    };
    router2.currentPath = function(){
        return testUrl.split('#').slice(1)[1];
    };

    t.equal(router1.find(), 'users');
    t.equal(router2.find(), 'home');

    testUrl = '/#/#/users/5';

    t.equal(router1.find(), 'home');
    t.equal(router2.find(), 'user');

    t.equal(router2.upOne(), '/users');
});

test('serialise / deserialise values', function(t) {
    t.plan(3);

    var routes = {
            home: {
                _url: '/serialised/{foo}/{bar}',
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
        },
        router3 = new Router(routes);

    var values = {
            foo: new Date(2000,1,1),
            bar: 'bar',
        },
        url = router3.get('home', values),
        expectedUrl =  '/serialised/2000-01-31T14:00:00.000Z/bar';

    t.equal(url.replace(router3.basePath, ''), expectedUrl, 'serialise returned expected url');
    t.equal(router3.find(router3.basePath + expectedUrl), 'home', 'found the correct route');
    t.deepEqual(router3.values(router3.basePath + expectedUrl), values, 'deserialise returned expected route values');

});
