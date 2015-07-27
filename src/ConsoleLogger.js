/*
 * Copyright (C) 2014 Anthony O'Hagan. Apache 2.0 Licence. http://www.apache.org/licenses/LICENSE-2.0
 */

/**
* Used internally to log output to the console.
 *
 * Designed so that this.log.<method>() calls ...
 *
 * - Can be grouped into regions that collapse/expand (using console.group/groupEnd)
 * - Retains hyperlinks to source code - Since they bind to console.debug()/.log()/.info()/.warn()/.error()
 * - this.log.error()/this.log.fatal() show stack traces since they both bind to console.error

 * @class
* @private
*/
Ext.define('AL.ConsoleLogger', {
    /**
     * {Boolean} Prevent method interception
     * @private
     */
    nointercept: true,

    /**
     * {String} Name of class logged.
     * @private
     */
    clsName: null,

    /**
    * Cached depth prefixes indexed by depth level.
    * Avoid generating lots of garbage collected strings.
    * @private
    */
    depthPrefixes: new Array(0),

    /**
     * {Function} Log a debug message
     */
    debug: null,
    /**
     * {Function} Log an internal message
     */
    log: null,
    /**
     * {Function} Log a informational message
     */
    info: null,
    /**
     * {Function} Log a warning message
     */
    warn: null,
    /**
     * {Function} Log an error message
     */
    error: null,
    /**
     * {Function} Log a fatal error message
     */
    fatal: null,

    /**
     * {Function} Log an exception throw by a watched method
     */
    exception: null,
    /**
     * {Function} Log class.method() and arguments of a watched method
     */
    precall: null,
    /**
     * {Function} Log class.method(), return value and arguments of a watched method
     */
    postcall: null,
    /**
     * {Function} Used to indicate the beginning of a call when precall is not used and useGroups == true
     */
    beginCall: null,
    /**
     * {Function} Used to indicate the end of a call when postcall is not used and useGroups == true
     */
    endCall: null,

    /**
     * {Function} Log class.method(), when a method is registered to be watched.
     */
    watch: null,

    constructor: function (logger, clsName) {
        var me = this;
        var useGroups = logger.useGroups && console.group && console.groupEnd;
        this.clsName = clsName;

        // Compute log level of class from rules
        var logLevel = logger.getClassLogLevel(clsName);

        // Binds logging methods for a logger instance that log: prefix, className, arguments ...
        // Calls to exception, precall and postcall already include their prefix and clsName.
        ['log', 'debug', 'info', 'warn', 'error', 'fatal'].forEach(function (fnName) {
            var prefix = logger.prefixes[fnName];
            var fn = fnName === 'fatal' ? console.error : console[fnName];

            var nLevel = AL.LogLevels[fnName.toUpperCase()];
            if (nLevel < logLevel) {
                // Disable log calls if below logging level of this class.
                me[fnName] = Ext.emptyFn;
            } else if (useGroups) {
                // Binds to console methods directly so console in Chrome shows
                // hyperlinks to source code and error()/fatal() show stack traces.
                me[fnName] = fn.bind(console, prefix, clsName);
            } else {
                me[fnName] = function () {
                    var fn = fn.bind(console, logger.getDepthPrefix(), prefix, clsName);
                    fn.apply(console, arguments);
                };
            }
        });

        this.watch = this.postcall = function() {
            console.log.apply(console, arguments); // LOG
        };

        this.throwex = function(msg) {
            this.error(msg);
            throw msg;
        };

        this.callbegin = Ext.emptyFn;
        this.callend = Ext.emptyFn;

        // Adds instance methods
        if (logger.showDepth) {
            if (useGroups) {
                // Google Chrome tracks call depth using grouping that display each call as a collapsible region
                this.precall = function() {
                    console.group.apply(console, arguments); // GROUP
                }

                this.postcall = function () {
                    console.log.apply(console, arguments); // LOG
                    console.groupEnd();
                };

                this.exception = function () {
                    console.warn.apply(console, arguments); // WARN
                    console.groupEnd();
                };

                this.group = function() {
                    console.group.apply(console, arguments); // GROUP
                };

                this.callbegin = function(header) {
                    console.group(header);
                };

                this.callend = function() {
                    console.groupEnd();
                };
            } else {
                // Will only show depth prefixes on precalls and postcalls not other logging.
                this.precall =  this.postcall = function () {
                    var log = console.log.bind(console, logger.getDepthPrefix());
                    log.apply(console, arguments);  // LOG
                };

                this.exception = function () {
                    var warn = console.warn.bind(console, logger.getDepthPrefix());
                    warn.apply(console, arguments); // WARN
                };
            }
        } else {
            this.precall = this.postcall = function() {
                console.log.apply(console, arguments); // LOG
            }
            this.exception = function() {
                console.warn.apply(console, arguments); // WARN
            }
        }
    }
});

