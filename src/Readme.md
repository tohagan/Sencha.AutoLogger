## Sencha Auto Logger

Provides a rule based logging extension framework for Sencha ExtJS and Sencha Touch applications and libraries.

Rules are declared after Sencha core classes but before application and other Sencha classes are defined.
They allow performance optimised fine grained control of application logging that does not alter application
code and thus is invaluable in diagnosing faults for both development and production apps.

Automatic logging of method calls can be enabled on any pattern of namespace, class or method name.
This significantly reduces logging coding effort since now entire classes or namespaces can be logged with a single rule.
Dynamic method logging has zero performance impact when not enabled so is preferable in performance sensitive production apps.

Logging rules can record: Pre-call arguments, Post-call results (or arguments), Call Exceptions, Nested call depth and Call Timings.
Nested call tracking displays collapsible per call grouping if supported by the browser's `console` object.
The injected code is optimised based on the features selected. For example, timing, exceptions and call depth tracking inject a
a try/catch block per call that is removed if these features are disabled.

Traditional manual logging calls are supported by injection of a logging object per class for classes that declares the property `log: true`
Class methods can then call `.debug()/.info()/.log()/.warn()/.error()/.fatal()` methods on this class logger object.
Logged output automatically includes the class name and log level and participates in call depth tracking if enabled.

A default logging level controls which of the `.debug()/.info()/.log()/.warn()/.error()/.fatal()` calls are output.
When possible, disabled methods on the class logger instance are replaced by Ext.emptyFn so as to incur least performance overhead.
Static logging level rules can be used to adjust the logging level of sets of classes or class namespaces.
Dynamic rules can be used to trigger adjustment of the logging level in the scope of any method or event.

### Example:

      // Applies logging over set of classes & methods.
      AL.Logger.logCalls(/controller/);   // Log all requests, responses, exceptions & call times from controller methods
      AL.Logger.logCalls(/controller/, null, false);  // Exclude call times.
      AL.Logger.logCalls(null, /event/);  // Log all methods named '*event*'
      AL.Logger.logCalls(/^PT$/);         // Log 'PT' application methods

      AL.Logger.logPreCalls(/model/);     // Only log requests
      AL.Logger.logPostCalls(/model/);    // Only log responses

      Ext.define('com.cool.MyClass', {
          logMethods: /^on/,   // Auto log all methods starting with "on" prefix.

          log: true,           // Replaced with static AL.Logger instance linked that logs the class name

          funky: function() {
             // Displayed if AL.LogLevels.DEBUG is set via AL.Logger.setClassLogLevel() or AL.Logger.setLogLevel()
             this.debug.info('Debugging Me');
          },

          onLogged() { return 10; }  // selected by logMethods attribute
      });
