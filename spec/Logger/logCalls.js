Ext.define('AL.spec.Logger.logCalls', {});

describe("AL.Logger", function () {
    function toArray (args) {
        return Array.prototype.slice.call(args, 0);
    }

    var calls = [];
    var clsConfig = {
        log: true,

        fn1: function () {
            this.fn2();  // check scope & nested calls
            this.log.info('returning "C"');
            return 'C';
        },

        fn2: function () {
        },

        throwex: function () {
            this.throwex2();
            return 'C';  // should never get here
        },

        throwex2: function () {
            throw 'ex2';
        }
    };

    // Capture all calls into calls[] array
    Ext.define('LoggerSpy', {
        nointercept: true,

        constructor: function (logger, clsName) {
            var me = this;
            this.clsName = clsName;
        },

        watch: function() { calls.push( {fn: 'watch', args: toArray(arguments)} ); },
        precall: function() { calls.push( {fn: 'precall', args: toArray(arguments)} ); },
        postcall: function() { calls.push( {fn: 'postcall', args: toArray(arguments)} ); },
        exception: function() { calls.push( {fn: 'exception', args: toArray(arguments)} ); },

        // Called when useGroups is enabled to begin or end a group
        callbegin: function() { calls.push( {fn: 'callbegin', args: toArray(arguments)} ); },
        callend: function() { calls.push( {fn: 'callend' } ); },

        debug: function() { calls.push( {fn: 'debug', args: toArray(arguments)} ); },
        log: function() { calls.push( {fn: 'log', args: toArray(arguments)} ); },
        info: function() { calls.push( {fn: 'info', args: toArray(arguments)} ); },
        warn: function() { calls.push( {fn: 'warn', args: toArray(arguments)} ); },
        error: function() { calls.push( {fn: 'error', args: toArray(arguments)} ); },
        fatal: function() { calls.push( {fn: 'fatal', args: toArray(arguments)} ); }
    });

    beforeEach(function () {
        calls = [];
        AL.Logger.init({
            defaultLogLevel: AL.LogLevels.INFO,
            useGroups: true,
            loggerCls: 'LoggerSpy'  // Remove to inspect console grouped output in Chrome
        });
    });

    describe(".logCalls()", function () {

        it("with no exception, should log precalls & postcalls", function() {
            AL.Logger.logCalls('Class1', null, false);
            Ext.define('Class1', Ext.clone(clsConfig));

            var obj = Ext.create('Class1');

            obj.fn1('a', 1);

            expect(calls).toEqual([
                { fn : 'watch', args : [ 'Class1.fn1()', 'Logging pre/post-calls' ] },
                { fn : 'watch', args : [ 'Class1.fn2()', 'Logging pre/post-calls' ] },
                { fn : 'watch', args : [ 'Class1.throwex()', 'Logging pre/post-calls' ] },
                { fn : 'watch', args : [ 'Class1.throwex2()', 'Logging pre/post-calls' ] },

                { fn : 'precall', args : [ 0, '=> Class1.fn1()', 'a', 1 ] },
                  { fn : 'precall', args : [ 1, '=> Class1.fn2()' ] },
                  { fn : 'postcall', args : [ 1, '<= Class1.fn2()', undefined ] },
                { fn : 'info', args : [ 'returning "C"' ] },
                { fn : 'postcall', args : [ 0, '<= Class1.fn1()', 'C' ] }
            ]);
        });

        it("with exception, should log precalls & exceptions", function() {
            AL.Logger.logCalls('Class2', null, false);
            Ext.define('Class2', Ext.clone(clsConfig));

            var obj = Ext.create('Class2');

            expect(function() { obj.throwex('a', 1); }).toThrow('ex2');
            expect(calls).toEqual([
                { fn : 'watch', args : [ 'Class2.fn1()', 'Logging pre/post-calls' ] },
                { fn : 'watch', args : [ 'Class2.fn2()', 'Logging pre/post-calls' ] },
                { fn : 'watch', args : [ 'Class2.throwex()', 'Logging pre/post-calls' ] },
                { fn : 'watch', args : [ 'Class2.throwex2()', 'Logging pre/post-calls' ] },

                { fn : 'precall', args : [ 0, '=> Class2.throwex()', 'a', 1 ] },
                  { fn : 'precall', args : [ 1, '=> Class2.throwex2()' ] },
                  { fn : 'exception', args : [ 1, '[EXC] Class2.throwex2()', 'ex2' ] },
                { fn : 'exception', args : [ 0, '[EXC] Class2.throwex()', 'ex2' ] }
            ]);
        });

    });

    describe(".logPreCalls()", function () {

        it("with no exception, should log precall() & callend() only", function() {
            AL.Logger.logPreCalls('Class1', null, false);
            Ext.define('Class1', Ext.clone(clsConfig));

            var obj = Ext.create('Class1');

            obj.fn1('a', 1);

            expect(calls).toEqual([
                { fn : 'watch', args : [ 'Class1.fn1()', 'Logging pre-calls' ] },
                { fn : 'watch', args : [ 'Class1.fn2()', 'Logging pre-calls' ] },
                { fn : 'watch', args : [ 'Class1.throwex()', 'Logging pre-calls' ] },
                { fn : 'watch', args : [ 'Class1.throwex2()', 'Logging pre-calls' ] },
                { fn : 'precall', args : [ 0, '=> Class1.fn1()', 'a', 1 ] },
                  { fn : 'precall', args : [ 1, '=> Class1.fn2()' ] },
                  { fn : 'callend' },
                  { fn : 'info', args : [ 'returning "C"' ] },
                { fn : 'callend' }
            ]);
        });

        it("with exception, should log precall() and callend()", function() {
            AL.Logger.logPreCalls('Class2', null, false);
            Ext.define('Class2', Ext.clone(clsConfig));

            var obj = Ext.create('Class2');

            expect(function() { obj.throwex('a', 1); }).toThrow('ex2');
            expect(calls).toEqual([
                { fn : 'watch', args : [ 'Class2.fn1()', 'Logging pre-calls' ] },
                { fn : 'watch', args : [ 'Class2.fn2()', 'Logging pre-calls' ] },
                { fn : 'watch', args : [ 'Class2.throwex()', 'Logging pre-calls' ] },
                { fn : 'watch', args : [ 'Class2.throwex2()', 'Logging pre-calls' ] },
                { fn : 'precall', args : [ 0, '=> Class2.throwex()', 'a', 1 ] },
                  { fn : 'precall', args : [ 1, '=> Class2.throwex2()' ] },
                  { fn : 'callend' },
                { fn : 'callend' }
            ]);
        });

    });

    describe(".logPostCalls()", function () {

        it("with no exception, should log callabegin() and postcall()", function() {
            AL.Logger.logPostCalls('Class1', null, false);
            Ext.define('Class1', Ext.clone(clsConfig));

            var obj = Ext.create('Class1');

            obj.fn1('a', 1);

            expect(calls).toEqual([ 
                { fn : 'watch', args : [ 'Class1.fn1()', ': Logging post-calls' ] },
                { fn : 'watch', args : [ 'Class1.fn2()', ': Logging post-calls' ] },
                { fn : 'watch', args : [ 'Class1.throwex()', ': Logging post-calls' ] },
                { fn : 'watch', args : [ 'Class1.throwex2()', ': Logging post-calls' ] },
                { fn : 'callbegin', args : [ 'Class1.fn1()' ] },
                  { fn : 'callbegin', args : [ 'Class1.fn2()' ] },
                  { fn : 'postcall', args : [ 1, '<= Class1.fn2()', undefined ] },
                  { fn : 'info', args : [ 'returning "C"' ] },
                { fn : 'postcall', args : [ 0, '<= Class1.fn1()', 'C', 'a', 1 ] } 
            ]);
        });

        it("with exception, should log callbegin() and exception()", function() {
            AL.Logger.logPostCalls('Class2', null, false);
            Ext.define('Class2', Ext.clone(clsConfig));

            var obj = Ext.create('Class2');

            expect(function() { obj.throwex('a', 1); }).toThrow('ex2');
            
            expect(calls).toEqual([ { fn : 'watch', args : [ 'Class2.fn1()', ': Logging post-calls' ] },
                { fn : 'watch', args : [ 'Class2.fn2()', ': Logging post-calls' ] },
                { fn : 'watch', args : [ 'Class2.throwex()', ': Logging post-calls' ] },
                { fn : 'watch', args : [ 'Class2.throwex2()', ': Logging post-calls' ] },
                { fn : 'callbegin', args : [ 'Class2.throwex()' ] },
                  { fn : 'callbegin', args : [ 'Class2.throwex2()' ] },
                  { fn : 'exception', args : [ 1, '[EXC] Class2.throwex2()', 'ex2' ] },
                { fn : 'exception', args : [ 0, '[EXC] Class2.throwex()', 'ex2' ] } ]);
        });

    });


});

//        it("static methods", function() {
//            fail("not implemented");
//        });
//
//        it("inheritableStatics methods", function() {
//            fail("not implemented");
//        });
//
//        it("mixin methods", function() {
//            fail("not implemented");
//        });
//
//        it("singleton methods", function() {
//            fail("not implemented");
//        });


//
//    it("should register precall/postcall/exception logging", function() {
//        Ext.define('Test.Class1', Ext.clone(clsConfig));
//        Ext.define('Test.Class2', Ext.clone(clsConfig));
//        Ext.define('STTest.Class3', Ext.clone(clsConfig));
//
//        expect(AL.Logger.getClassLogLevel('Class1')).toBe(AL.LogLevels.INFO);
//        var obj = Ext.create('Class1');
//        obj.testInfo();
//        obj.testWarn();
//        expect(console.info).toHaveBeenCalledWith('[INF] ', 'Class1', 'test.info()');
//        expect(console.warn).toHaveBeenCalledWith('[WRN] ', 'Class1', 'test.warn()');
//    });
//
//    it("should not change logging level for unselected classes", function() {
//        Ext.define('Class2', Ext.clone(clsConfig));
//        expect(AL.Logger.getClassLogLevel('Class2')).toBe(AL.LogLevels.WARN);
//        var obj = Ext.create('Class2');
//        obj.testInfo();
//        obj.testWarn();
//        expect(console.info).not.toHaveBeenCalled();
//        expect(console.warn).toHaveBeenCalledWith('[WRN] ', 'Class2', 'test.warn()');
//    });

