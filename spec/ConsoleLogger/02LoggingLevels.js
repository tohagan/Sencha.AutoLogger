Ext.define('AL.spec.ConsoleLogger.02LoggingLevels', {});

describe("AL.ConsoleLogger - 02 Logging Levels", function () {

    beforeEach(function () {
        spyOn(console, 'debug');
        spyOn(console, 'log');
        spyOn(console, 'info');
        spyOn(console, 'warn');
        spyOn(console, 'error');
    });

    function sendMessages(logger, arg1, arg2) {
        logger.debug('Debug', arg1, arg2);
        logger.log('Log', arg1, arg2);
        logger.info('Info', arg1, arg2);
        logger.warn('Warn', arg1, arg2);
        logger.error('Error', arg1, arg2);
        logger.fatal('Fatal', arg1, arg2);
    }

    function checkLevel(level, arg1, arg2) {
        if (level <= AL.LogLevels.DEBUG) {
            expect(console.debug).toHaveBeenCalledWith('[DBG] ', 'MyApp.Logger.Test1', 'Debug', arg1, arg2);
        } else {
            expect(console.debug).not.toHaveBeenCalled();
        }

        if (level <= AL.LogLevels.LOG) {
            expect(console.log).toHaveBeenCalledWith('[LOG] ', 'MyApp.Logger.Test1', 'Log', arg1, arg2);
        } else {
            expect(console.log).not.toHaveBeenCalled();
        }

        if (level <= AL.LogLevels.INFO) {
            expect(console.info).toHaveBeenCalledWith('[INF] ', 'MyApp.Logger.Test1', 'Info', arg1, arg2);
        } else {
            expect(console.info).not.toHaveBeenCalled();
        }
        if (level <= AL.LogLevels.WARN) {
            expect(console.warn).toHaveBeenCalledWith('[WRN] ', 'MyApp.Logger.Test1', 'Warn', arg1, arg2);
        } else {
            expect(console.warn).not.toHaveBeenCalled();
        }

        if (level <= AL.LogLevels.ERROR) {
            expect(console.error).toHaveBeenCalledWith('[ERR] ', 'MyApp.Logger.Test1', 'Error', arg1, arg2);
        }
    }

    describe("AL.Logger.init()", function () {
        function testLevel(level) {
            AL.Logger.init({defaultLogLevel: level});
            // TODO: Replace with var logger = new AL.ConsoleLogger(fakeLogger, 'MyApp.Logger.Test1');
            var logger = AL.Logger.getLogger('MyApp.Logger.Test1');
            sendMessages(logger, 'x', 1);
            checkLevel(level, 'x', 1);
        }

        it("with defaultLogLevel: AL.LogLevels.DEBUG, should only call debug() or higher levels", function () {
            testLevel(AL.LogLevels.DEBUG);
        });

        it("with defaultLogLevel: AL.LogLevels.LOG, should only call log() or higher levels", function () {
            testLevel(AL.LogLevels.LOG);
        });

        it("with defaultLogLevel: AL.LogLevels.INFO, should only call info() or higher levels", function () {
            testLevel(AL.LogLevels.INFO);
        });

        it("with defaultLogLevel: AL.LogLevels.WARN, should only call warn() or higher levels", function () {
            testLevel(AL.LogLevels.WARN);
        });

        it("with defaultLogLevel: AL.LogLevels.ERROR, should only call error() or higher levels", function () {
            testLevel(AL.LogLevels.ERROR);
        });

        it("with defaultLogLevel: AL.LogLevels.FATAL, should only call fatal()", function () {
            testLevel(AL.LogLevels.FATAL);
            expect(console.error).toHaveBeenCalledWith('[FTL] ', 'MyApp.Logger.Test1', 'Fatal', 'x', 1);
        });

        it("with defaultLogLevel: AL.LogLevels.NONE, should not all any log methods", function () {
            AL.Logger.init({defaultLogLevel: AL.LogLevels.NONE});
            var logger = AL.Logger.getLogger('MyApp.Logger.Test1');
            sendMessages(logger, 'x', 1);

            expect(console.debug).not.toHaveBeenCalled();
            expect(console.log).not.toHaveBeenCalled();
            expect(console.info).not.toHaveBeenCalled();
            expect(console.warn).not.toHaveBeenCalled();
            expect(console.error).not.toHaveBeenCalled();
        });
    });

});
