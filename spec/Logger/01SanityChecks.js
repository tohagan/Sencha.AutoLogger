Ext.define('AL.spec.Logger.01SanityChecks', {});

describe("AL.Logger - 01 Sanity Checks", function () {
    describe("Sanity checks", function () {
        it("AL.LogLevels is object", function () {
            expect(AL.LogLevels).toEqual(jasmine.any(Object));
        });

        it("AL.Logger is object", function () {
            expect(AL.Logger).toEqual(jasmine.any(Object));
        });

        it(".init() is a static function", function () {
            expect(AL.Logger.init).toEqual(jasmine.any(Function));
        });
    });
});
