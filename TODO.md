
## To do

Add interceptors for callback functions
  - Displays functions sent as arguments as #F<unique-number>
  - When the function is called, report the call as #F<unique-number>(): args ...
  - A rule option to turn this on for method calls.

## Ideas

Perhaps replace ST.Logger.logCalls()/preCalls()/postCalls()/ with a single ST.Logger.logCalls() that
uses an `options` object to select the features to enable/disable.
These options can also be defaulted via ST.Logger.init(options).
- options: { timing: true, preArgs: true, postArgs: true, results: true, exceptions: true, callbacks: true }

Full blown ...
  - Log visualisation server that shows call instances in GraphViz


