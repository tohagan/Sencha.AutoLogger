/*
 * Copyright (C) 2014 Anthony O'Hagan. Apache 2.0 Licence. http://www.apache.org/licenses/LICENSE-2.0
 */

Ext.namespace('AL');

/**
* Logging levels
* @enum
*/
AL.LogLevels = {
    /**
     * @property
     * debug() calls
     */
    DEBUG: 0,
    /**
     * @property
     * log() calls
     */
    LOG: 1,
    /**
    * @property
    * info() calls
    */
    INFO: 2,
    /**
    * @property
    * warn() calls
    */
    WARN: 3,
    /**
    * @property
    * error() calls
    */
    ERROR: 4,
    /**
    * @property
    * fatal() calls
    */
    FATAL: 5,
    /**
    * @property
    * Call request
    */
    PRECALL: 6,
    /**
    * @property
    * Call response
    */
    POSTCALL: 7,
    /**
    * @property
    * Exception during a call (often expected so does not imply warn/error/fatal)
    */
    EXCEPTION: 8,
    /**
    * @property
    * Enumeration maximum value
    */
    NONE: 9,
    /**
     * @property
     * Enumeration maximum value
     */
    MAX: 9
};

/**
 * Injects logging or debug breaks points into Sencha class methods.
 *
 */


/**
 * Provides a rule based logging extension framework for Sencha ExtJS and Sencha Touch applications and libraries.
 *
 * Rules are declared after Sencha core classes but before application and other Sencha classes are defined.
 * They allow performance optimised fine grained control of application logging that does not alter application
 * code and thus is invaluable in diagnosing faults for both development and production apps.
 *
 * Automatic logging of method calls can be enabled on any pattern of namespace, class or method name.
 * This significantly reduces logging coding effort since now entire classes or namespaces can be logged with a single rule.
 * Dynamic method logging has zero performance impact when not enabled so is preferable in performance sensitive production apps.
 *
 * Logging rules can record: Pre-call arguments, Post-call results (or arguments), Call Exceptions, Nested call depth and Call Timings.
 * Nested call tracking displays collapsible per call grouping if supported by the browser's `console` object.
 * The injected code is optimised based on the features selected. For example, timing, exceptions and call depth tracking inject a
 * a try/catch block per call that is removed if these features are disabled.
 *
 * Traditional manual logging calls are supported by injection of a logging object per class for classes that declares the property `log: true`
 * Class methods can then call `.debug()/.info()/.log()/.warn()/.error()/.fatal()` methods on this class logger object.
 * Logged output automatically includes the class name and log level and participates in call depth tracking if enabled.
 *
 * A default logging level controls which of the `.debug()/.info()/.log()/.warn()/.error()/.fatal()` calls are output.
 * When possible, disabled methods on the class logger instance are replaced by Ext.emptyFn so as to incur least performance overhead.
 * Static logging level rules can be used to adjust the logging level of sets of classes or class namespaces.
 * Dynamic rules can be used to trigger adjustment of the logging level in the scope of any method or event.
 *
 * Example:
 *
 *      // Applies logging over set of classes & methods.
 *      AL.Logger.logCalls(/controller/);   // Log all requests, responses, exceptions & call times from controller methods
 *      AL.Logger.logCalls(/controller/, null, false);  // Exclude call times.
 *      AL.Logger.logCalls(null, /event/);  // Log all methods named '*event*'
 *      AL.Logger.logCalls(/^PT$/);         // Log 'PT' application methods
 *
 *      AL.Logger.logPreCalls(/model/);     // Only log requests
 *      AL.Logger.logPostCalls(/model/);    // Only log responses
 *
 *      Ext.define('com.cool.MyClass', {
 *          logMethods: /^on/,   // Auto log all methods starting with "on" prefix.
 *
 *          log: true,           // Replaced with static AL.Logger instance linked that logs the class name
 *
 *          funky: function() {
 *             // Displayed if AL.LogLevels.DEBUG is set via AL.Logger.setClassLogLevel() or AL.Logger.setLogLevel()
 *             this.debug.info('Debugging Me');
 *          },
 *
 *          onLogged() { return 10; }  // selected by logMethods attribute
 *      });
 *
 * @class
 * @singleton
 */
Ext.define('AL.Logger', {

    singleton: true,

    requires: [
        'AL.Interceptor',
        'AL.ConsoleLogger'
    ],

    /**
    * {Boolean} Excludes class from interception
    * @private
    */
    nointercept: true,

    /**
    * Logs message showing call depth
    * @property
    */
    showDepth: true,

    /**
    * Minimum logging level required to show a logged message
    * @property
    */
    showLevel: 1,

    /**
     * {Number} Current call depth for dynamic call logging
     * Updated via ConsoleLogger()
     * @private
     */
    depth: 0,

    /**
     * {Array} cacched depath prefixes.
     * @private
     */
    depthPrefixes: [''],

    /**
     * {String} Constant used to compute call depth prefix
     * @private
     */
    DEPTH_STR: "| ",

    /**
    * Set of class patterns for which logging is enabled.
    * @property {Array} Array of class level rules
    *   - clsPattern {RegExp}  Selects a set of class names
    *   - level {Number} minimum logging level for matching classes
    */
    levelRules: [],

    /**
    * Cache of per class loggers.
    * @private
    */
    clsLoggers: {},

    /**
    * Output prefix applied to each message type
    * @private
    */
    prefixes: {},

    /**
    * Output logger class
    * @private
    */
    loggerCls: null,

    /**
    * Default logging level if none is specified by a rule.
    * @property {Number} Logging level
    */
    defaultLogLevel: null,

    /**
     * Safely set options with a default when value can be falsey.
     * @private
     */
    setOption: function(options, name, defValue) {
        this[name] = typeof (options[name]) == 'undefined' ? defValue : options[name];
    },

    init: function (options) {
        // Options are mostly used by output logger class
        options = options || {};
        AL.Interceptor.init(options);

        this.setOption(options, 'defaultLogLevel', AL.LogLevels.WARN);
        this.setOption(options, 'useGroups', true); // use console.group()/groupEnd()
        this.setOption(options, 'showLevel', true);
        this.setOption(options, 'showDepth', true);

        if (!this.showDepth) this.useGroups = false;

        this.loggerCls = options.loggerCls || 'AL.ConsoleLogger';

        this.levelRules = [];
        this.clsLoggers = {};

        this.prefixes = options.prefixes || {
            exception: "[EXC] ",
            precall:   "=> ",
            postcall:  "<= ",
            debug:     "[DBG] ",
            log:       "[LOG] ",
            info:      "[INF] ",
            warn:      "[WRN] ",
            error:     "[ERR] ",
            fatal:     "[FTL] "
        };

        this.logger = this.getLogger('');   // Default logger (empty class name)
    },

    /**
     * {Number} Compute string that indents logging lines to show call depth.
     * We cache the result to minimize performance cost including string garbage collection.
     * @private
     */
    getDepthPrefix: function () {
        if (this.depth <= 0) return '';

        if (this.depth > this.depthPrefixes.length) {
            // Grow array by 20 more
            this.depthPrefixes = new Array(this.depthPrefixes.length + 20);
            this.depthPrefixes[0] = '';
            for (i = 1; i < this.depthPrefixes.length; i++) {
                this.depthPrefixes[i] = this.depthPrefixes[i-1] + this.DEPTH_STR;
            }
        }

        return this.depthPrefixes[this.depth];
    },

    /**
    * Factory for finding/creating logger class instances (one per class)
    */
    getLogger: function (clsName) {
        if (this.loggerCls == null) throw "AL.Logger.init() not called.";

        var logger = this.clsLoggers[clsName];
        if (typeof logger !== 'object') {
            logger = this.clsLoggers[clsName] = Ext.create(this.loggerCls, this, clsName);  // Cache the class logger
        }
        return logger;
    },

    /**
     * Sets a logging level when calling a selected set of class methods. Restores previous leven when it returns
     * @param {Mixed} classes Selects classes by {String} name, {Array} list or {RegExp} pattern, All (`true`), None (`false`)
     * @param {Mixed} methods Selects methods by {String} name, {Array} list or {RegExp} pattern, All (`true`), None (`false`)
     * @param {Number} level Logging level (defined by
     */
    setLogLevelWhenCalling: function (classes, methods, level) {
        var transform = this.injectSetLogLevel.bind(this, level);
        AL.Interceptor.addTransform(classes, methods, transform, this);
        // TODO: BUG - May Need to adjust the class logging level and then dynamically check the current log level before calling log methods.
    },

    /**
    * Applys a logging level to a set of classes.
    * Adds to set of rules that are are applied in sequence so later rules can override earlier rules.
    * Must be defined prior to defining application classes. Rules are computed once as each new class is defined.
    * @param {Mixed} classes Selects classes by {String} name, {Array} list or {RegExp} pattern, All (`true`), None (`false`)
    * @param {Number} Minimum logging level for selected classes.
    */
    setClassLogLevel: function (classes, level) {
        this.levelRules.push({ cls: AL.Interceptor.toRegExp(classes), level: level });
    },

    /**
    * Computes the logging level for a new class based on logging level rules.
    * @param className Fully qualified class name
    * @return {Number} Logging level of the class.
    * @private
    */
    getClassLogLevel: function (className) {
        var level = this.defaultLogLevel;
        this.levelRules.forEach(function (rule) {
            if (rule.cls.test(className)) level = rule.level;
        });
        return level;
    },

    /**
    * Log debug information
    * @param {Arguments} [arguments] Values to be logged.
    */
    debug: function () {
        Array.prototype.unshift.call(arguments, this.prefixes.debug);
        this.logger.debug.apply(logger, arguments);
    },

    /**
    * Log general information
    * @param {Arguments} [arguments] Values to be logged.
    */
    info: function () {
        Array.prototype.unshift.call(arguments, this.prefixes.info);
        this.logger.info.apply(logger, arguments);
    },

    /**
    * Log application warnings
    * @param {Arguments} [arguments] Values to be logged.
    */
    warn: function () {
        Array.prototype.unshift.call(arguments, this.prefixes.warn);
        this.logger.warn.apply(logger, arguments);
    },

    /**
    * Log application errors
    * @param {Arguments} [arguments] Values to be logged.
    */
    error: function () {
        Array.prototype.unshift.call(arguments, this.prefixes.error);
        this.logger.error.apply(logger, arguments);
    },

    /**
    * Log fatal application errors
    * @param {Arguments} [arguments] Values to be logged.
    */
    fatal: function () {
        Array.prototype.unshift.call(arguments, this.prefixes.fatal);
        this.logger.fatal.apply(logger, arguments);
    },

    /**
     * Logs an error using all the arguments and then throws an exception using `msg`.
     * @param {String} msg Exception message
     */
    throwex: function(msg) {
        Array.prototype.unshift.call(arguments, this.prefixes.error);
        this.logger.error.apply(logger, arguments);
        throw msg;
    },

    /**
    * Registers selected classes & methods to log call arguments, results.
    *
    * - Arguments are displayed *before* the call.
    * - Results are displayed *after* the call.
    * - Indents nested calls if #showDepth is true
    *
    * @param {Mixed} classes Selects classes by {String} name, {Array} list or {RegExp} pattern, All (`true`), None (`false`)
    * @param {Mixed} methods Selects methods by {String} name, {Array} list or {RegExp} pattern, All (`true`), None (`false`)
    * @param {Boolean} timeCalls If true, Show time delay in milliseconds per call (Default: true)
    */
    logCalls: function (classes, methods, timeCalls) {
        var transform = this.injectPrePostLogging.bind(this, typeof timeCalls === 'undefined' ? true : timeCalls);
        AL.Interceptor.addTransform(classes, methods, transform, this);
    },

    /**
    * Injects pre-call, post-call and exception logging on a class method. Tracks call depth.
    * @private
    * @param {Boolean} timeCalls if true, inject code to log the time delay per call.
    * @param {String} clsName Class name
    * @param {String} methodName Method name
    * @param {Function} fn method function to be transformed
    * @return {Function} Transformed function to replace the class method
    */
    injectPrePostLogging: function (timeCalls, clsName, methodName, fn) {
        var me = this;
        var logger = this.getLogger(clsName);
        var callName = clsName + '.' + methodName + '()';

        if (timeCalls) {
            logger.watch(callName, 'Logging timed pre/post-calls');
            return function () {
                var diff, start;
                var origDepth = me.depth;
                try {
                    me.depth++; // safest place to do this
                    var precall = logger.precall.bind(logger, origDepth, me.prefixes.precall + callName);
                    precall.apply(logger, arguments);
                    start = new Date();
                    var result = fn.apply(this, arguments); // call wrapped method
                    diff = new Date() - start;
                    logger.postcall(origDepth, me.prefixes.postcall + callName, diff + "ms", result);
                    return result;
                } catch (ex) {
                    diff = new Date() - start;
                    logger.exception(origDepth, me.prefixes.exception + callName, diff + "ms", ex);
                    throw ex;
                } finally {
                    me.depth--; // safest place to do this
                }
            };
        } else {
            logger.watch(callName, 'Logging pre/post-calls');
            return function () {
                var origDepth = me.depth;
                try {
                    me.depth++;  // safest place to do this
                    var precall = logger.precall.bind(logger, origDepth, me.prefixes.precall + callName);
                    precall.apply(logger, arguments);
                    var result = fn.apply(this, arguments); // call wrapped method
                    logger.postcall(origDepth, me.prefixes.postcall + callName, result);
                    return result;
                } catch (ex) {
                    logger.exception(origDepth, me.prefixes.exception + callName, ex);
                    throw ex;
                } finally {
                    me.depth--; // safest place to do this
                }
            };
        }
    },

    /**
    * Registers selected classes & methods to log pre-call argument values.
    *
    * - Arguments are displayed *before* the call.
    * - Indents nested calls if #showDepth is true
    *
    * @param {Mixed} classes Selects classes by {String} name, {Array} list or {RegExp} pattern, All (`true`), None (`false`)
    * @param {Mixed} methods Selects methods by {String} name, {Array} list or {RegExp} pattern, All (`true`), None (`false`)
    */
    logPreCalls: function (classes, methods) {
        AL.Interceptor.addTransform(classes, methods, this.injectPreLogging, this);
    },

    /**
    * Injects pre-call logging on a class method. Tracks call depth.
    * @private
    * @param {String} clsName Class name
    * @param {String} methodName Method name
    * @param {Function} fn method function to be transformed
    * @return {Function} Transformed function to replace the class method
    */
    injectPreLogging: function (clsName, methodName, fn) {
        var me = this;
        var logger = this.getLogger(clsName);
        var callName = clsName + '.' + methodName + '()';
        logger.watch(callName, 'Logging pre-calls');

        if (this.showDepth) {
            return function () {
                var origDepth = me.depth;
                try {
                    me.depth++; // safest place to do this
                    var precall = logger.precall.bind(logger, origDepth, me.prefixes.precall + callName);
                    precall.apply(logger, arguments);
                    return fn.apply(this, arguments); // call wrapped method
                } finally {
                    if (me.useGroups) logger.callend();
                    me.depth--; // safest place to do this
                }
            };
        } else {
            return function () {
                var precall = logger.precall.bind(logger, 0, me.prefixes.precall + callName);
                precall.apply(logger, arguments);
                return fn.apply(this, arguments); // call wrapped method
            };
        }
    },

    /**
    * Registers selected classes & methods to log call both arguments and results in a single log record.
    *
    * - Arguments and Results are displayed *after* the call.
    * - Indents nested calls if #showDepth is true
    *
    * **WARNING**: Arguments may potentially have been modified by the call itself.  Use #logCall or #logPreCall to log pre-call argument values.
    *
    * @param {Mixed} classes Selects classes by {String} name, {Array} list or {RegExp} pattern, All (`true`), None (`false`)
    * @param {Mixed} methods Selects methods by {String} name, {Array} list or {RegExp} pattern, All (`true`), None (`false`)
    * @param {Boolean} timeCalls If true, Show time delay in milliseconds per call (Default: true)
    */
    logPostCalls: function (classes, methods, timeCalls) {
        var transform = this.injectPostLogging.bind(this, typeof timeCalls === 'undefined' ? true : timeCalls);
        AL.Interceptor.addTransform(classes, methods, transform, this);
    },

    /**
    * Injects post-call and exception logging on class methods. Tracks call depth.
    * @private
    * @param {Boolean} timeCalls if true, inject code to log the time delay per call.
    * @param {String} clsName Class name
    * @param {String} methodName Method name
    * @param {Function} fn method function to be transformed
    * @return {Function} Transformed function to replace class method
    */
    injectPostLogging: function (timeCalls, clsName, methodName, fn) {
        var me = this;
        var logger = this.getLogger(clsName);
        var callName = clsName + '.' + methodName + '()';

        if (timeCalls) {
            logger.watch(callName, ': Logging timed post-calls');
            return function () {
                var diff, start;
                var origDepth = me.depth;
                try {
                    me.depth++;  // safest place to do this
                    if (me.useGroups) logger.callbegin(callName);
                    start = new Date();
                    var result = fn.apply(this, arguments); // call wrapped method
                    diff = new Date() - start;
                    var postcall = logger.postcall.bind(logger, origDepth, me.prefixes.postcall + callName, diff + "ms", result);
                    postcall.apply(logger, arguments);
                    return result;
                } catch (ex) {
                    diff = new Date() - start;
                    logger.exception(origDepth, me.prefixes.exception + callName, diff + "ms", ex);
                    throw ex;
                }  finally {
                    me.depth--; // safest place to do this
                }
            };
        } else {
            logger.watch(callName, ': Logging post-calls');
            return function () {
                var origDepth = me.depth;
                try {
                    me.depth++;
                    if (me.useGroups) logger.callbegin(callName);
                    var result = fn.apply(this, arguments); // call wrapped method
                    var postcall = logger.postcall.bind(logger, origDepth, me.prefixes.postcall + callName, result);
                    postcall.apply(logger, arguments);
                    return result;
                } catch (ex) {
                    logger.exception(origDepth, me.prefixes.exception + callName, ex);
                    throw ex;
                } finally {
                    me.depth--;
                }
            };
        }
    },

    /**
    * Injects code to triggers a new logging level when method is called and restores previous logging level when it returns.
    * @private
     * @param {Number} level New logging level
     * @param {String} clsName Class name
     * @param {String} methodName Method name
     * @param {Function} fn Method being wrapper that triggers new logging level
    */
    injectSetLogLevel: function (level, clsName, methodName, fn) {
        var me = this;
        return function () {
            if (level === me.showLevel) { // try/catch is expensive so avoid if no level change
                return fn.apply(this, arguments);  // call wrapped method
            } else {
                var prevLevel = me.showLevel;
                try {
                    me.showLevel = level;
                    return fn.apply(this, arguments); // call wrapped method
                } finally {
                    me.showLevel = prevLevel;
                }
            }
        };
    },

    /**
     * Used to register permanent method logging on Sencha classes that define a 'logMethods' field.
     * @private
     * @param {String} class Class name from Ext.define().
     * @param {Object} cls Class instance.
     * @param {Object} data Class configuration from Ext.define().
     * @param {Mixed} data.logMethods methods by {String} name, {Array} list or {RegExp} pattern, All (`true`), None (`false`)
     */
    onRegisterLogMethods: function (className, cls, data) {
        if (data.logMethods !== false) {
            this.logCalls(className, data.logMethods);
        }
    },

    /**
     * Sencha Class preprocessor to creates a logger instance for each class that defines a 'logger: true' field.
     * @private
     * @param {Object} cls Class instance.
     * @param {Object} data Class configuration from Ext.define().
     * @param {Boolean} data.logger If true, adds an AL.ClassLogger instance as class static variable.
     */
    onCreateClassLogger: function (cls, data) {
        var log = data.log;
        delete cls.log;
        if (log === true) {
            data.log = AL.Logger.getLogger(cls.getName());
        }
    }

}, function () {
    //<feature logMethods>
    // Apply logging interception for Sencha classes that use *logMethods: methodPattern* in their config.
    Ext.ClassManager.registerPostprocessor('logMethods', AL.Logger.onRegisterLogMethods);
    //</feature>

    //<feature logger>
    // Create a logger for Sencha classes that define `logger: true`.
    Ext.Class.registerPreprocessor('log', AL.Logger.onCreateClassLogger);
    //</feature>
});

