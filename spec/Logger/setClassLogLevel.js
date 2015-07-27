Ext.define('AL.spec.Logger.setClassLogLevel', {});

describe("AL.Logger.setClassLogLevel()", function () {
    beforeEach(function () {
        AL.Logger.init({defaultLogLevel: AL.LogLevels.WARN});
        AL.Logger.setClassLogLevel('Class1', AL.LogLevels.INFO);
        spyOn(console, 'debug');
        spyOn(console, 'log');
        spyOn(console, 'info');
        spyOn(console, 'warn');
        spyOn(console, 'error');
    });

    var clsConfig = {
        log: true,  // replaced with logger

        testInfo: function() {
            this.log.info("test.info()");
        },

        testWarn: function() {
            this.log.warn("test.warn()");
        }
    };

    it("should change logging level for selected classes", function() {
        Ext.define('Class1', Ext.clone(clsConfig));
        expect(AL.Logger.getClassLogLevel('Class1')).toBe(AL.LogLevels.INFO);
        var obj = Ext.create('Class1');
        obj.testInfo();
        obj.testWarn();
        expect(console.info).toHaveBeenCalledWith('[INF] ', 'Class1', 'test.info()');
        expect(console.warn).toHaveBeenCalledWith('[WRN] ', 'Class1', 'test.warn()');
    });

    it("should not change logging level for unselected classes", function() {
        Ext.define('Class2', Ext.clone(clsConfig));
        expect(AL.Logger.getClassLogLevel('Class2')).toBe(AL.LogLevels.WARN);
        var obj = Ext.create('Class2');
        obj.testInfo();
        obj.testWarn();
        expect(console.info).not.toHaveBeenCalled();
        expect(console.warn).toHaveBeenCalledWith('[WRN] ', 'Class2', 'test.warn()');
    });
});
