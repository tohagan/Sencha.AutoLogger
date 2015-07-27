/*
 * Copyright (C) 2014 Anthony O'Hagan. Apache 2.0 Licence. http://www.apache.org/licenses/LICENSE-2.0
 */

// Use Sencha Loader to ensure all classes are loaded before running tests and to support requires:[] properties in classes

Ext.Loader.setConfig ({
    enabled: true,
    disableCaching: false  // remove _dc= prefix to keep breakpoints.
});

Ext.Loader.setPath({
    'AL': '../src',
    'AL.spec': '.'
});

Ext.require([
    'AL.Interceptor',
    'AL.Logger',

    'AL.spec.Interceptor.sanity',
    'AL.spec.Interceptor.around',
    'AL.spec.Interceptor.toRegExp',
    'AL.spec.Interceptor.onClassCreate',
    'AL.spec.ConsoleLogger.01CallLogging',
    'AL.spec.ConsoleLogger.02LoggingLevels',
    'AL.spec.Logger.01SanityChecks',
    'AL.spec.Logger.02LogMethods',
    'AL.spec.Logger.setClassLogLevel',
    'AL.spec.Logger.logCalls'
]);

// Use this for lib testing
Ext.onReady( function () {
    var env = jasmine.getEnv();
    env.updateInterval = 1000;
    env.addReporter(new jasmine.HtmlReporter());
    env.execute();
});

// Use this for app testing
//Ext.application('TestApp', {
//    name: 'ST',

//    requires: [
//        'AL.Interceptor',
//        'AL.Logger',
//        'AL.Test.InterceptorSpec.around',
//        'AL.Test.InterceptorSpec.toRegExp',
//        'AL.Test.InterceptorSpec.onClassCreate',
//        'AL.Test.Logger'
//    ],

//    //controllers:[ 'MyController' ],
//    //models: [ 'MyModel' ],
//    //stores: [ 'MyStore' ],
//    //views: [ 'MyView' ],
//    autoCreateViewport: false,

//    launch: function () {
//        alert('launch');

//        //include the tests in the test.html head
//        //        jasmine.getEnv().addReporter(new jasmine.TrivialReporter());
//        //        jasmine.getEnv().execute()
//        debugger;
//        var env = jasmine.getEnv();
//        env.updateInterval = 1000;
//        env.addReporter(new jasmine.HtmlReporter());
//        env.execute();
//    }
//});
