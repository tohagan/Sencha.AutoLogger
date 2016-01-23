/*
 * Copyright (C) 2014 Anthony O'Hagan. Apache 2.0 Licence. http://www.apache.org/licenses/LICENSE-2.0
 */

Ext.namespace('AL');

/**
 * AOP interception methods for injecting code into Sencha class methods.
 * Applies interception rules as new Sencha classes are created.
 * Excludes classes that define 'nointercept: true'
 *
 * NOTE: Currently class/method pattern rules must be declared for classes that are yet to be defined via Ext.define().
 * This assumes that the rules are predefined and hence 'static' in nature.
 * In the future we can add the ability to dynamically apply rules to existing classes.
 *
 * NOTE: If applying method injection after the classes are defined, you may want
 * to use `ClassManager.getNamesByExpression(wildcard)` to get a list of class names by a wild card.
 *
 * @class
 * @singleton
 */
Ext.define('AL.Interceptor', {
    singleton: true,

    /**
    * {Boolean} Excludes class from interception
    * @private
    */
    nointercept: true,

    /**
     * Constant {RegExp} used by toRegExp()
     * @private
     */
    matchAll: /.?/,

    /**
     * Constant {RegExp} used by toRegExp()
     * @private
     */
    matchNone: /===NoNe===/,

    /**
     * List of interception rules added by interceptionMethods()
     * @private
     */
    interceptors: [],

    /**
     * Initialise
     */
    init: function() {
        this.interceptors = [];
    },

    /**
     * Applies an interception transform a selected set of Sencha class methods.
     * @param {Mixed} classes Selects classes by {String} name, {Array} list or {RegExp} pattern, All (`true`), None (`false`)
     * @param {Mixed} methods Selects methods by {String} name, {Array} list or {RegExp} pattern, All (`true`), None (`false`)
     * @param {Function} onTransform Transforms a method into an intercepted method.
     *   - @param {String} className Name of class
     *   - @param {String} methodName Name of class method
     *   - @param {Function} method Class method that will be transformed
     * @param {Object} scope Scope applied to onTransform function.
     */
    addTransform: function(classes, methods, onTransform, scope) {
        this.interceptors.push({
            classes:  this.toRegExp(classes),
            methods:  this.toRegExp(methods),
            onTransform: onTransform,
            scope:    scope
        });
    },

    /**
     * Injects {onBefore}, {onAfter}, {onException} functions around each method in a set of selected Sencha class methods.
     * @param {Mixed} classes Selects classes by {String} name, {Array} list or {RegExp} pattern, All (`true`), None (`false`)
     * @param {Mixed} methods Selects methods by {String} name, {Array} list or {RegExp} pattern, All (`true`), None (`false`)
     * @param {Function} onBefore Function executed before each selected method. Can be null.
     * @param {Function} onAfter Function executed after each selected method.  Can be null.
     * @param {Function} onException Function executed instead of onAfter when an excpetion occurs.  Can be null.
     * @param {Object} scope Scope applied to onBefore, onAfter and onExeption.
     */
    addInterceptor: function(classes, methods, onBefore, onAfter, onException, scope) {
        var me = this;

        var onTransform = function(className, methodName, method) {
            if (onBefore) onBefore = onBefore.bind(scope, className, methodName);
            if (onAfter)  onAfter  = onAfter.bind(scope, className, methodName);
            if (onException) onException = onException.bind(scope, className, methodName);
            return me.around(onBefore, method, onAfter, onException, scope);
        };

        this.addTransform(classes, methods, onTransform);
    },

    /**
     * Removes interception transforms on a set of class methods if any was applied.
     * Useful when you wish to apply a rules to a large set of methods and then exclude some.
     *
     * @param {Mixed} classes Selects classes by {String} name, {Array} list or {RegExp} pattern, All (`true`), None (`false`)
     * @param {Mixed} methods Selects methods by {String} name, {Array} list or {RegExp} pattern, All (`true`), None (`false`)
     * @param {Function} onTransform Transforms a method into an intercepted method.
     */
    removeTransform: function(classes, methods) {
        var me = this;

        var onTransform = function(className, methodName, method) {
            if (method.hasOwnProperty('$previous')) {
                return method.$previous;
            } else {
                return method;
            }
        };

        this.addTransform(classes, methods, onTransform);
    },

    /**
     * Injects a function before another function and return the resulting new function.
     * @param {Function} onBefore Executed before `fn` in returned function.
     * @param {Function} fn Function being intercepted.
     * @param {Function} onException Executed if `fn` throws an exception.
     * @param {Object} scope Scope applied to onBefore and onException.
     * @return {Function} Returns new function that executes {onBefore} then `fn`.
     */
    before: function (onBefore, fn, onException, scope) {
        return this.around(onBefore, fn, null, onException, scope);
    },

    /**
     * Injects a function after another function and return the resulting new function.
     * @param {Function} fn Function to be .
     * @param {Function} onAfter Executed after #fn successfully completes.
     * @param {Function} onException Executed if `fn` throws an exception.
     * @param {Object} scope Scope applied to onAfter and onException.
     * @return {Function} Returns new function that executes #fn then {onAfter}.
     */
    after: function(fn, onAfter, onException, scope) {
        return this.around(null, fn, onAfter, onException, scope);
    },

    /**
     * Used to create a new interceptor function that injects new functions before and/or after a class method.
     * Injected function can be bound to a different scope to the original function.
     *
     * Returns an optimised wrapper function based on the non-null event functions (onBefore, onAfter, onException).
     *
     * If `onBefore`, `onAfter` or `onException` are null they are not executed
     * and the returned function is optimised to remove reference to them.
     * @param {Function} onBefore function to execute before `fn`. Can be null.
     * @param {Function} fn function being intercepted.  Must not be null.
     * @param {Function} onAfter function to execute after `fn`.  Can be null.
     * @param {Function} onException Execute after `fn`.  Can be null.
     * @param {Object} [scope] Scope applied to `onBefore`, `onAfter` and `onException`.
     * @return {Function} The new intercepted function. Normally assigned to the original function `fn`.
     */
    around: function(onBefore, fn, onAfter, onException, scope) {
        if (typeof fn !== 'function')     throw "AL.Interceptor.around(): fn is not Function";
        if (typeof scope === 'undefined') throw "AL.Interceptor.around(): scope is not defined";

        scope = scope || this;

        // Function factory optimizes the returned function and validates the types.
        if (typeof onBefore === 'function' && typeof onAfter === 'function' && typeof onException === 'function') {
            return function () {
                try {
                    onBefore.apply(scope, arguments);
                    var result = fn.apply(this, arguments);
                    onAfter.call(scope, result, arguments);
                    return result;
                } catch(ex) {
                    onException.call(scope, ex, arguments);
                    throw ex;
                }
            };
        } else if (typeof onBefore === 'function' && typeof onAfter === 'function' && onException === null) {
            return function () {
                onBefore.apply(scope, arguments);
                var result = fn.apply(this, arguments);
                onAfter.call(scope, result, arguments);
                return result;
            };
        } else if (typeof onBefore === 'function' && onAfter === null && typeof onException === 'function') {
            return function () {
                try {
                    onBefore.apply(scope, arguments);
                    return fn.apply(this, arguments);
                } catch (ex) {
                    onException.call(scope, ex, arguments);
                    throw ex;
                }
            };
        } else if (typeof onBefore === 'function' && onAfter === null && onException === null) {
            return function () {
                onBefore.apply(scope, arguments);
                return fn.apply(this, arguments);
            };
        } else if (onBefore === null && typeof onAfter === 'function' && typeof onException === 'function') {
            return function () {
                try {
                    var result = fn.apply(this, arguments);
                    onAfter.call(scope, result, arguments);
                    return result;
                } catch (ex) {
                    onException.call(scope, ex, arguments);
                    throw ex;
                }
            };
        } else if (onBefore === null && typeof onAfter === 'function' && onException === null) {
            return function () {
                var result = fn.apply(this, arguments);
                onAfter.call(scope, result, arguments);
                return result;
            };
        } else if (onBefore === null && onAfter === null && typeof onException === 'function') {
            return function () {
                try {
                    return fn.apply(this, arguments);
                } catch (ex) {
                    onException.call(scope, ex, arguments);
                    throw ex;
                }
            };
        } else if (onBefore === null && onAfter === null && onException === null) {
            return fn;  // no change
        } else {
            throw "AL.Interceptor.around(): invalid argument types";
        }
    },

    /**
     * Apply a interceptor rules to a class.
     * @private
     * @param {Array} interceptors List of interceptor rules
     *  - classes {RegExp} Selects the set of classes
     *  - methods: {RegExp} Selects the set of methods from the selected `classes`
     *  - onBefore: {Function} Injected before each selected method
     *  - onAfter: {Function} Injected after each selected method
     *  - onException: {Function} Injected when a method throw an exception
     *  - scope: Scope for onBefore and onAfter
     * @param {String} className Name of class.
     * @param {Object} data Class configuration object containing properties and methods.
     * @param {Function} createdFn Invoked after class is created
     */
    onClass: function(interceptors, className, data, createdFn) {
        var me = this;
        me.interceptors.forEach(function(interceptor) {
            if (className.match(interceptor.classes)) {
                if (!data.nointercept) {
                    for (var methodName in data) {
                        var method = data[methodName];
                        if (typeof method === 'function' && methodName.match(interceptor.methods)) {
                            //console.log({cls: className, name: methodName, method: method});
                            data[methodName] = interceptor.onTransform.call(interceptor.scope, className, methodName, method);
                            data[methodName].$previous = method;    // allow undo.
                        }
                    }
                }
            }
        });
    },

    /**
     * Applies registered interceptors on Sencha classes as they are created.
     * @private
     * @ignore
     * @param {String} className Name of class.
     * @param {Object} data Class configuration object containing properties and methods.
     * @param {Function} createdFn Invoked after class is created
     */
    onClassCreate: function(className, data, createdFn) {
        // TODO: Not yet intercepting get/set/apply/update methods generated by ClassManager
        // We intercept prior to the class being created to avoid complications with multiple interceptions on inherited methods.
        // This is fixable by creating an object in the class instance that records intercepted methods
        // or perhaps by using method.$previous that records the original method.

        this.onClass(this.interceptors, className, data);
    },

    /**
     * Execute before `Ext.application()` in a Sencha application
     * @private
     * @ignore
     * {Object} data Used to define a new Sencha application class. Contains class properties and methods
     */
    onApplication: function(data) {
        this.onClass(this.interceptors, data.name, data);
    },

    // TODO: Remove
    /**
     * Execute before `Ext.define()` in a Sencha application
     * @private
     * @ignore
     * {Object} data Used to define a new Sencha class. Contains class properties and methods
     */
    onDefine: function(className, data) {
        this.onClass(this.interceptors, className, data);
    },

   /**
     * Converts a pattern selector of mixed type to a `RegExp` object.
     * @private
     * @param {Mixed} pattern
     * @return {RegExp} Return a regular expression based on
     *  - null = Matches All
     *  - true = Matches All
     *  - false = Matches None
     *  - {String} Matches exactly,
     *  - {Array} Matches any string element exactly
     *  - {RegExp} Matches the regular expression
     */
    toRegExp: function(pattern) {
        var t = Object.prototype.toString.call(pattern);

        switch (t) {
            case '[object Undefined]':
            case '[object Null]':
                return this.matchAll;
            case '[object RegExp]':
                return pattern;
            case '[object Array]':
                // Ensure namespace "." delimiters are preserved
                pattern = pattern.map(function(x) { return x.replace(/\./g, '\\.'); });
                return new RegExp('^(' + pattern.join('|') + ')$');
        }

        if (typeof pattern === "string") {
            // Ensure namespace "." delimiters are preserved
            return new RegExp('^' + pattern.replace(/\./g, '\\.') + '$');
        } else if (pattern === true) {
            return this.matchAll;
        } else if (pattern === false) {
            return this.matchNone;
        } else {
            throw "AL.Interceptions.addInterceptor(): Invalid argument type";
        }
    }
}, function() {
    // Apply interception rules to new Sencha classes, excludes classes that define 'nointercept: true'
    Ext.ClassManager.create = AL.Interceptor.before(AL.Interceptor.onClassCreate, Ext.ClassManager.create, null, AL.Interceptor);
    // Apply interception rules to Ext.app.Application instance
    Ext.application = AL.Interceptor.before(AL.Interceptor.onApplication, Ext.application, null, AL.Interceptor);
});


