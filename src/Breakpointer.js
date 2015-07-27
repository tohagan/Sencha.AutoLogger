/*
 * Copyright (C) 2014 Anthony O'Hagan. Apache 2.0 Licence. http://www.apache.org/licenses/LICENSE-2.0
 */

/**
* @class
* Injects a debugger breakpoint before, after or on exception for a set of methods selected by class/method patterns.
* @singleton
*/
AL.Breakpointer = {
    /**
    * {Boolean} Excludes class from interception
    * @private
    */
    nointercept: true,

    /**
    * Injects `debugger` breakpoint.
    * @private
    */
    breakpoint: function() { debugger; },

    /**
     * Triggers a breakpoint *before* calling a set of methods selected by class and method patterns
     * @param {Mixed} classes Selects classes by {String} name, {Array} list or {RegExp} pattern, All (`true`), None (`false`)
     * @param {Mixed} methods Selects methods by {String} name, {Array} list or {RegExp} pattern, All (`true`), None (`false`)
     */
    before: function(classes, methods) {
        AL.Interceptor.addInterceptor(classes, methods, this.breakpoint, null, null, this);
    },

    /**
     * Triggers a breakpoint *after* calling a set of methods selected by class and method patterns
     * @param {Mixed} classes Selects classes by {String} name, {Array} list or {RegExp} pattern, All (`true`), None (`false`)
     * @param {Mixed} methods Selects methods by {String} name, {Array} list or {RegExp} pattern, All (`true`), None (`false`)
     */
    after: function(classes, methods) {
        AL.Interceptor.addInterceptor(classes, methods, null, this.breakpoint, null, this);
    },

    /**
     * Triggers a breakpoint if selected methods fires an exception
     * @param {Mixed} classes Selects classes by {String} name, {Array} list or {RegExp} pattern, All (`true`), None (`false`)
     * @param {Mixed} methods Selects methods by {String} name, {Array} list or {RegExp} pattern, All (`true`), None (`false`)
     */
    exception: function(classes, methods) {
        AL.Interceptor.addInterceptor(classes, methods, null, null, this.breakpoint, this);
    }
};
