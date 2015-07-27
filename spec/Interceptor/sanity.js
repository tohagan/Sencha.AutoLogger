Ext.define('AL.spec.Interceptor.sanity', {});

describe("AL.spec.Interceptor.sanity", function () {
    describe('ST', function() {
        it('is defined', function() {
            expect(ST).toBeDefined();
        });
    });

    describe('AL.Interceptor', function() {
        it('is defined', function() {
            expect(AL.Interceptor).toBeDefined();
        });
    });

    describe('AL.Interceptor', function () {
        describe("Sanity checks", function () {
            it("AL.Interceptor is object", function () {
                expect(typeof AL.Interceptor).toBe('object');
            });

            it(".reset() is a static function", function () {
                expect(typeof AL.Interceptor.init).toBe('function');
            });

            it(".before() is a static function", function () {
                expect(typeof AL.Interceptor.before).toBe('function');
            });

            it(".after() is a static function", function () {
                expect(typeof AL.Interceptor.after).toBe('function');
            });

            it(".around() is a static function", function () {
                expect(typeof AL.Interceptor.around).toBe('function');
            });

            it(".onClassCreate() is a static function", function () {
                expect(typeof AL.Interceptor.onClassCreate).toBe('function');
            });
        });
    });
});

