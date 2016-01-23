# Sencha Auto Logger

Automated rule based logging API for Sencha ExtJS & Sencha Touch. 

## Summary

Significantly reduces diagnostic logging coding effort and speeds up defect diagnosis. Entire classes or namespaces can be logged with a single line rule. Displays as collapsible regions and hyperlinked to log calls in Chrome console. 

Zero overheads when disabled so ideal for diagnosing faults in both development and production builds. 

Injects logging and performance measurement into any pattern of namespace, class or method name. 
Name patterns can be: string, array or regex (match full name or part). 
Rules can select logging level.

Performance optimised call logging that records: 
- class and method name, 
- call arguments and response,
- exceptions,
- call timing 
- nested call depth 

Integrated with Chrome console logger to display nested calls / args / responses / exceptions as a collapsible tree.
- Logging detail can be enabled/disabled to reduce output or improve execution overheads per call.

## Details

Rules are declared after Sencha core classes but before application and other Sencha classes are defined.

They allow performance optimised fine grained control of application logging that does not alter most application
code (only app.js startup) and thus is invaluable in diagnosing faults in both indevelopment and production.

Logging of method calls can be enabled on any pattern of namespace, class or method name. 
This significantly reduces logging coding effort since now entire classes or namespaces can be logged with a single rule.
Zero performance impact when not enabled so is preferable in performance sensitive production apps.
You can also elect to conditionally active logging rules (e.g. based on device id or server cookies).

Logging rules can record: Pre-call arguments, Post-call results (or arguments), Call Exceptions, Nested call depth and Call Timings.
Nested call tracking displays collapsible per call grouping if supported by the browser's `console` object.
The injected code is optimised based on the features selected. For example, timing, exceptions and call depth tracking inject a
a try/catch block per call that is removed if these features are disabled.

Traditional manual logging calls are supported by injection of a logging object per class for classes that declares the property `log: true`. 
Class methods can then call `.debug()/.info()/.log()/.warn()/.error()/.fatal()` methods on this class logger object.
Logged output automatically includes the class name and log level and participates in call depth tracking if enabled.

A default logging level controls which of the `.debug()/.info()/.log()/.warn()/.error()/.fatal()` calls are output.
When possible, disabled methods on the class logger instance are replaced by Ext.emptyFn so as to incur least performance overhead.
Static logging level rules can be used to adjust the logging level of sets of classes or class namespaces.
Dynamic rules can be used to trigger adjustment of the logging level in the scope of any method or event.

### Startup:

      Ext.Loader.setPath({
        'AL': 'AL/src',
        'Ext': 'touch/src',
        'MyApp': 'app'
      });

      Ext.require([
        'AL.Interceptor',
        'AL.Logger'
      ], function () {
        AL.Logger.init();
        // ** Add logging rules here **
        AL.Logger.logCalls(/ComponentPaint/, /Hidden/);
      });

      Ext.Application( ... );
      
      
### Example Logging Rules:

      // Applies logging over set of classes & methods.

      // Log all requests, responses, exceptions & call times from controller methods
      AL.Logger.logCalls(/controller/);   

      // Exclude call times.
      AL.Logger.logCalls(/controller/, null, false);  
      
      // Log all methods named '*event*'
      AL.Logger.logCalls(null, /event/);  
      
      // Log all class methods in PT namespaces
      AL.Logger.logCalls(/^PT$/);         

      AL.Logger.logPreCalls(/model/);     // Only log requests
      AL.Logger.logPostCalls(/model/);    // Only log responses

## Class logging:

      Ext.define('com.cool.MyClass', {
          // Logs class methods starting with "on" prefix.
          logMethods: /^on/,   

          // Replaced with static AL.Logger instance that logs the class name.
          log: true,           

          funky: function() {
             // Displayed if AL.LogLevels.DEBUG is set via AL.Logger.setClassLogLevel() or AL.Logger.setLogLevel()
             this.debug.info('Debugging Me');
          },

          onLogged() { return 10; }  // selected by logMethods attribute
      });
