Ext.define('AL.spec.Logger', {});

// ** NOT USED **

describe("AL.Logger", function () {

    describe("check logging", function () {
        // class methods and properties used in Ext.define()
        var classConf = {
            fn0: 3, // used to check we only intercept functions
            fn1: function (a, b) { this.checkScope(); return a + b; },
            fn2: function (a, b) { this.checkScope(); return a - b; },
            fn3: function (a, b) { this.checkScope(); return a * b; },

            checkScope: function () { }
        };

        beforeEach(function () {
            logged = [];
            AL.Logger.reset();

            console.log = AL.Interceptor.before(function () { logged.push({ l: 'log', a: arguments }); }, console.log, null, null);
            console.info = AL.Interceptor.before(function () { logged.push({ l: 'info', a: arguments }); }, console.info, null, null);
            console.warn = AL.Interceptor.before(function () { logged.push({ l: 'warn', a: arguments }); }, console.warn, null, null);
            console.error = AL.Interceptor.before(function () { logged.push({ l: 'error', a: arguments }); }, console.error, null, null);


            console.log = AL.Interceptor.before(function () { logged.push({ l: 'log', a: arguments }); }, console.log, null, null);
            console.info = AL.Interceptor.before(function () { logged.push({ l: 'info', a: arguments }); }, console.info, null, null);
            console.warn = AL.Interceptor.before(function () { logged.push({ l: 'warn', a: arguments }); }, console.warn, null, null);
            console.error = AL.Interceptor.before(function () { logged.push({ l: 'error', a: arguments }); }, console.error, null, null);
        });

        var Transfomer = {
            transform: function (className, methodName, method) {
                this.checkScope2();
                intercepted.push({ cls: className, name: methodName });
                return function (a, b) {
                    var result = method.call(this, a, b);
                    return { cls: className, name: methodName, result: result };
                };
            },

            checkScope2: Ext.emptyFn
        };

    });
});
