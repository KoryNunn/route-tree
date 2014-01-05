var grape = require('grape'),
    Router = require('../'),
    router = new Router({
        '/things/new':'newThing',
        '/things/{0}/stuff/{1}': 'aStuff',
        '/things/{0}': 'thing',
        '/things': 'things',
        '/': 'home'
    });

grape('match a route', function(t){
    t.plan(6);

    t.equal(router.find('/things/5'), 'thing');
    t.equal(router.find('/things'), 'things');
    t.equal(router.find('/things/5/stuff/1'), 'aStuff');
    t.equal(router.find('/'), 'home');
    t.equal(router.find('/things/new'), 'newThing');
    t.equal(router.find('/stuff'), undefined);
});

grape('up a level', function(t){
    t.plan(2);

    t.equal(router.upOne('/things/5/stuff/majigger'), '/things/5');
    t.equal(router.upOne('/things/5'), '/things');
});

grape('get', function(t){
    t.plan(2);

    t.equal(router.get('home'), '/');
    t.equal(router.get('thing', 1), '/things/1');
});