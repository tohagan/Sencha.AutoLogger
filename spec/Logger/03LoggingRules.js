Ext.define('AL.spec.Logger.03LoggingRules', {});

describe("AL.Logger - 02 Logging Rules", function () {
    describe("Sanity checks", function () {
        it("AL.LogLevels is object", function () {
            expect(AL.LogLevels).toEqual(jasmine.any(Object));
        });

        it("AL.Logger is object", function () {
            expect(AL.Logger).toEqual(jasmine.any(Object));
        });

        it(".init() is a static function", function () {
            expect(AL.Logger.init).toEqual(jasmine.any(Function));
        });
    });
});


Ext.define('AL.spec.Interceptor.onClassCreate', {});

// TODO: Add tests for Interceptor.addInterceptor() - most cases are already covered via calls to around() via addTransform()

describe("EXAMPLE test Classes", function () {
    var order, Class1, Class2;
    beforeEach(function () {
        order = [];

        Class1 = {
            wrapped: function () {
                order.push({ fn: 'wrapped()', args: arguments });
                this.wrapped2();
                return 'C';
            },

            wrapped2: function () {
                order.push('wrapped2()');
            },

            throwex: function () {
                order.push({ fn: 'throwex()', args: arguments });
                this.throwex2();
                return 'C';  // should never get here
            },

            throwex2: function () {
                order.push('throwex2()');
                throw 'throwex2';
            }
        };

        // interception methods all call this.something2() to check 'this' assignment is correct
        Class2 = {
            onBefore: function () { order.push({ fn: 'onBefore()', args: arguments }); this.onBefore2(); },
            onBefore2: function () { order.push('onBefore2()'); },

            onAfter: function () { order.push({ fn: 'onAfter()', args: arguments }); this.onAfter2(); },
            onAfter2: function () { order.push('onAfter2()'); },

            onException: function () { order.push({ fn: 'onException()', args: arguments }); this.onException2(); },
            onException2: function () { order.push('onException2'); }
        };
    });

});

describe("AL.Interceptor.addTransform()/onClassCreate()", function() {
    var intercepted;

    // class methods and properties used in Ext.define()
    var classConf = {
        fn0: 3, // used to check we only intercept functions
        fn1: function(a, b) { this.checkScope(); return a + b; },
        fn2: function(a, b) { this.checkScope(); return a - b; },
        fn3: function(a, b) { this.checkScope(); return a * b; },

        checkScope: function() {}
    };

    beforeEach(function() {
        AL.TClass1 = null;
        AL.TClass2 = null;
        intercepted = [];
        AL.Interceptor.reset();
    });

    var Transfomer = {
        transform: function(className, methodName, method) {
            this.checkScope2();
            intercepted.push({ cls : className, name : methodName });
            return function(a, b) {
                var result = method.call(this, a, b);
                return {cls: className, name: methodName, result: result };
            };
        },

        checkScope2: Ext.emptyFn
    };

    it("is a static function", function() {
        expect(typeof AL.Interceptor.onClassCreate).toBe('function');
    });

    it("should intercept class member functions for Ext.define()", function() {
        AL.Interceptor.addTransform(['AL.TClass1', 'AL.TClass2'], /fn[012]/, Transfomer.transform, Transfomer);
        Ext.define('AL.TClass1', Ext.clone(classConf));
        Ext.define('AL.TClass2', Ext.clone(classConf));
        Ext.define('AL.TClass3', Ext.clone(classConf));

        expect(intercepted).toEqual([
            { cls : 'AL.TClass1', name : 'fn1' },
            { cls : 'AL.TClass1', name : 'fn2' },
            { cls : 'AL.TClass2', name : 'fn1' },
            { cls : 'AL.TClass2', name : 'fn2' }
        ]);

        var x = new AL.TClass1();
        expect(x.fn0).toBe(3); // not intercepted
        expect(x.fn1(1, 2)).toEqual({ cls : 'AL.TClass1', name : 'fn1', result:  3 }); // intercepted
    });

    // Failing becase Ext.application creates an instance of Ext.app.Application - not a new class.

    it("should intercept methods of Ext.app.Application instance", function() {
        AL.Interceptor.addTransform('MyApp', /fn[123]/, Transfomer.transform, Transfomer);
        var conf = Ext.clone(classConf);
        conf.name = 'MyApp';
        Ext.application(conf);

        expect(intercepted).toEqual([
            { cls : 'MyApp', name : 'fn1' },
            { cls : 'MyApp', name : 'fn2' },
            { cls : 'MyApp', name : 'fn3' }
        ]);

        expect(MyApp).toEqual(jasmine.any(Object));
        expect(MyApp.app).toEqual(jasmine.any(Object));
        expect(MyApp.app.fn0).toBe(3); // not intercepted
        expect(MyApp.app.fn1(1, 2)).toEqual({ cls : 'MyApp', name : 'fn1', result:  3 }); // intercepted
    });

    it("should replace selected methods", function() {
        AL.Interceptor.addTransform('AL.TClass3', /fn[012]/, Transfomer.transform, Transfomer);
        Ext.define('AL.TClass3', Ext.clone(classConf));

        var x = new AL.TClass3();
        expect(x.fn0).toBe(3); // not intercepted
        expect(x.fn1(1, 2)).toEqual({ cls : 'AL.TClass3', name : 'fn1', result:  3 }); // intercepted
        expect(x.fn2(1, 2)).toEqual({ cls : 'AL.TClass3', name : 'fn2', result: -1 }); // intercepted
        expect(x.fn3(1, 2)).toEqual(2);  // not intercepted
    });

    it("should not intercept when class.nointercept === true", function() {
        AL.Interceptor.addTransform('AL.TClass3', /fn[012]/, Transfomer.transform, Transfomer);
        var conf = Ext.clone(classConf);
        conf.nointercept = true;
        Ext.define('AL.TClass4', conf);

        var x = new AL.TClass4();
        expect(x.fn0).toBe(3);           // NOT intercepted
        expect(x.fn1(1, 2)).toEqual(3);  // NOT intercepted
        expect(x.fn2(1, 2)).toEqual(-1); // NOT intercepted
        expect(x.fn3(1, 2)).toEqual(2);  // NOT intercepted
    });

});
