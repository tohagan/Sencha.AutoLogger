Ext.define('AL.spec.ConsoleLogger.01CallLogging', {});

describe("AL.ConsoleLogger - 01 Call Logging", function () {
    describe("with .showDepth: true, .useGroups: true, ", function () {
        var logger;
        beforeEach(function () {
            spyOn(console, 'log');
            spyOn(console, 'warn');
            spyOn(console, 'group');
            spyOn(console, 'groupEnd');
            AL.Logger.init({showDepth: true, useGroups: true});
            // TODO: Replace with var logger = new AL.ConsoleLogger(fakeLogger, 'MyApp.Logger.Test1');

            logger = AL.Logger.getLogger('MyApp.Logger.Test1');
        });

        it(".precall() should call console.group()", function () {
            logger.precall('arg1', 'arg2', 'Precall');
            expect(console.group).toHaveBeenCalledWith('arg1', 'arg2', 'Precall');
        });

        it(".postcall() should call console.log() and console.groupEnd()", function () {
            logger.postcall('arg1', 'arg2', 'Postcall');
            expect(console.log).toHaveBeenCalledWith('arg1', 'arg2', 'Postcall');
            expect(console.groupEnd).toHaveBeenCalled();
        });

        it(".exception() should call console.warn() and console.groupEnd", function () {
            logger.exception('arg1', 'arg2', 'Exception');
            expect(console.warn).toHaveBeenCalledWith('arg1', 'arg2', 'Exception');
            expect(console.groupEnd).toHaveBeenCalled();
        });
    });

    describe("with .showDepth: true, .useGroups: false, ", function () {
        var logger;
        beforeEach(function () {
            spyOn(console, 'log');
            spyOn(console, 'warn');
            AL.Logger.init({showDepth: true, useGroups: false});
            // TODO: Replace with var logger = new AL.ConsoleLogger(fakeLogger, 'MyApp.Logger.Test1');
            logger = AL.Logger.getLogger('MyApp.Logger.Test1');
        });

        it(".precall() should call console.log()", function () {
            logger.precall('arg1', 'arg2', 'Precall');
            expect(console.log).toHaveBeenCalledWith('', 'arg1', 'arg2', 'Precall');
        });

        it(".postcall() should call console.log()", function () {
            logger.postcall('arg1', 'arg2', 'Postcall');
            expect(console.log).toHaveBeenCalledWith('', 'arg1', 'arg2', 'Postcall');
        });

        it(".exception() should call console.warn()", function () {
            logger.exception('arg1', 'arg2', 'Exception');
            expect(console.warn).toHaveBeenCalledWith('', 'arg1', 'arg2', 'Exception');
        });
    });

    describe("with .showDepth: false, ", function () {
        var logger;
        beforeEach(function () {
            spyOn(console, 'log');
            spyOn(console, 'warn');
            AL.Logger.init({showDepth: false});
            // TODO: Replace with var logger = new AL.ConsoleLogger(fakeLogger, 'MyApp.Logger.Test1');
            logger = AL.Logger.getLogger('MyApp.Logger.Test1');
        });

        it(".precall() should call console.log()", function () {
            logger.precall('Precall');
            expect(console.log).toHaveBeenCalledWith('Precall');
        });

        it(".postcall() should call console.log()", function () {
            logger.postcall('Postcall');
            expect(console.log).toHaveBeenCalledWith('Postcall');
        });

        it(".exception() should call console.warn()", function () {
            logger.exception('Exception');
            expect(console.warn).toHaveBeenCalledWith('Exception');
        });
    });
});