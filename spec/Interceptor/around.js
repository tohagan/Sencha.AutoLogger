Ext.define('AL.spec.Interceptor.around', {});

describe("AL.Interceptor.around()/before()/after()", function () {
    var order, Class1, Class2;

    beforeEach(function () {
        order = [];

        Class1 = {
            wrapped: function () {
                order.push({ fn: 'wrapped()', args: arguments });
                this.wrapped2();
                return 'C';
            },

            wrapped2: function () {
                order.push('wrapped2()');
            },

            throwex: function () {
                order.push({ fn: 'throwex()', args: arguments });
                this.throwex2();
                return 'C';  // should never get here
            },

            throwex2: function () {
                order.push('throwex2()');
                throw 'throwex2';
            }
        };

        // interception methods all call this.something2() to check 'this' assignment is correct
        Class2 = {
            onBefore: function () { order.push({ fn: 'onBefore()', args: arguments }); this.onBefore2(); },
            onBefore2: function () { order.push('onBefore2()'); },

            onAfter: function () { order.push({ fn: 'onAfter()', args: arguments }); this.onAfter2(); },
            onAfter2: function () { order.push('onAfter2()'); },

            onException: function () { order.push({ fn: 'onException()', args: arguments }); this.onException2(); },
            onException2: function () { order.push('onException2'); }
        };
    });

    describe(".around() interceptor", function () {
        describe("with onException === null", function () {
            it("should invoke onBefore() then wrapper() then onAfter()", function () {
                Class1.wrapped = AL.Interceptor.around(Class2.onBefore, Class1.wrapped, Class2.onAfter, null, Class2);
                Class1.wrapped('A', 'B');
                expect(order).toEqual([
                    { fn: 'onBefore()', args: ['A', 'B'] }, 'onBefore2()',
                    { fn: 'wrapped()', args: ['A', 'B'] }, 'wrapped2()',
                    { fn: 'onAfter()', args: ['C', ['A', 'B']] }, 'onAfter2()'
                ]);
            });

            it("should invoke onBefore() then wrapped() when onAfter is null", function () {
                Class1.wrapped = AL.Interceptor.around(Class2.onBefore, Class1.wrapped, null, null, Class2);
                Class1.wrapped('A', 'B');
                expect(order).toEqual([
                    { fn: 'onBefore()', args: ['A', 'B'] }, 'onBefore2()',
                    { fn: 'wrapped()', args: ['A', 'B'] }, 'wrapped2()'
                ]);
            });

            it("should invoke wrapped() then onAfter() when onBefore is null", function () {
                Class1.wrapped = AL.Interceptor.around(null, Class1.wrapped, Class2.onAfter, null, Class2);
                Class1.wrapped('A', 'B');
                expect(order).toEqual([
                    { fn: 'wrapped()', args: ['A', 'B'] }, 'wrapped2()',
                    { fn: 'onAfter()', args: ['C', ['A', 'B']] }, 'onAfter2()'
                ]);
            });

            it("should only invoke wrapped() when onAfter() and onBefore and null", function () {
                Class1.wrapped = AL.Interceptor.around(null, Class1.wrapped, null, null, Class2);
                Class1.wrapped('A', 'B');
                expect(order).toEqual([
                    { fn: 'wrapped()', args: ['A', 'B'] }, 'wrapped2()'
                ]);
            });
        });

        describe("with onException !== null exception is not thrown", function () {
            it("should invoke onBefore() then wrapped() then onAfter()", function () {
                Class1.wrapped = AL.Interceptor.around(Class2.onBefore, Class1.wrapped, Class2.onAfter, Class2.onException, Class2);
                Class1.wrapped('A', 'B');
                expect(order).toEqual([
                    { fn: 'onBefore()', args: ['A', 'B'] }, 'onBefore2()',
                    { fn: 'wrapped()', args: ['A', 'B'] }, 'wrapped2()',
                    { fn: 'onAfter()', args: ['C', ['A', 'B']] }, 'onAfter2()'
                ]);
            });

            it("should invoke onBefore() then wrapped() when onAfter is null", function () {
                Class1.wrapped = AL.Interceptor.around(Class2.onBefore, Class1.wrapped, null, Class2.onException, Class2);
                Class1.wrapped('A', 'B');
                expect(order).toEqual([
                    { fn: 'onBefore()', args: ['A', 'B'] }, 'onBefore2()',
                    { fn: 'wrapped()', args: ['A', 'B'] }, 'wrapped2()'
                ]);
            });

            it("should invoke wrapped() then onAfter() when onBefore is null", function () {
                Class1.wrapped = AL.Interceptor.around(null, Class1.wrapped, Class2.onAfter, Class2.onException, Class2);
                Class1.wrapped('A', 'B');
                expect(order).toEqual([
                    { fn: 'wrapped()', args: ['A', 'B'] }, 'wrapped2()',
                    { fn: 'onAfter()', args: ['C', ['A', 'B']] }, 'onAfter2()'
                ]);
            });

            it("should only invoke wrapped() when onAfter() and onBefore are null", function () {
                Class1.wrapped = AL.Interceptor.around(null, Class1.wrapped, null, Class2.onException, Class2);
                Class1.wrapped('A', 'B');
                expect(order).toEqual([
                    { fn: 'wrapped()', args: ['A', 'B'] }, 'wrapped2()'
                ]);
            });
        });

        describe("when onException !== null and exception is thrown", function () {
            it("should invoke onBefore() then wrapped() then onException() and not call onAfter()", function () {
                Class1.throwex = AL.Interceptor.around(Class2.onBefore, Class1.throwex, Class2.onAfter, Class2.onException, Class2);
                expect(function () { Class1.throwex('A', 'B'); }).toThrow('throwex2');
                expect(order).toEqual([
                    { fn: 'onBefore()', args: ['A', 'B'] }, 'onBefore2()',
                    { fn: 'throwex()', args: ['A', 'B'] }, 'throwex2()',
                    { fn: 'onException()', args: ['throwex2', ['A', 'B']] }, 'onException2'
                ]);
            });

            it("should invoke onBefore() then throwex() then onException when onAfter is null", function () {
                Class1.throwex = AL.Interceptor.around(Class2.onBefore, Class1.throwex, null, Class2.onException, Class2);
                expect(function () { Class1.throwex('A', 'B'); }).toThrow('throwex2');
                expect(order).toEqual([
                    { fn: 'onBefore()', args: ['A', 'B'] }, 'onBefore2()',
                    { fn: 'throwex()', args: ['A', 'B'] }, 'throwex2()',
                    { fn: 'onException()', args: ['throwex2', ['A', 'B']] }, 'onException2'
                ]);
            });

            it("should invoke throwex() then onException() when onBefore is null", function () {
                Class1.throwex = AL.Interceptor.around(null, Class1.throwex, Class2.onAfter, Class2.onException, Class2);
                expect(function () { Class1.throwex('A', 'B'); }).toThrow('throwex2');
                expect(order).toEqual([
                    { fn: 'throwex()', args: ['A', 'B'] }, 'throwex2()',
                    { fn: 'onException()', args: ['throwex2', ['A', 'B']] }, 'onException2'
                ]);
            });

            it("should invoke throwex() then onException() when onBefore and onAfter are null", function () {
                Class1.throwex = AL.Interceptor.around(null, Class1.throwex, null, Class2.onException, Class2);
                expect(function () { Class1.throwex('A', 'B'); }).toThrow('throwex2');
                expect(order).toEqual([
                    { fn: 'throwex()', args: ['A', 'B'] }, 'throwex2()',
                    { fn: 'onException()', args: ['throwex2', ['A', 'B']] }, 'onException2'
                ]);
            });
        });

    }); // .around()

    describe(".before()", function () {
        describe("with onException === null", function () {
            it("should invoke onBefore() then wrapped()", function () {
                Class1.wrapped = AL.Interceptor.before(Class2.onBefore, Class1.wrapped, null, Class2);
                Class1.wrapped('A', 'B');
                expect(order).toEqual([
                    { fn: 'onBefore()', args: ['A', 'B'] }, 'onBefore2()',
                    { fn: 'wrapped()', args: ['A', 'B'] }, 'wrapped2()'
                ]);
            });
        });

        describe("with onException !== null exception is not thrown", function () {
            it("should invoke onBefore() then wrapped()", function () {
                Class1.wrapped = AL.Interceptor.before(Class2.onBefore, Class1.wrapped, Class2.onException, Class2);
                Class1.wrapped('A', 'B');
                expect(order).toEqual([
                    { fn: 'onBefore()', args: ['A', 'B'] }, 'onBefore2()',
                    { fn: 'wrapped()', args: ['A', 'B'] }, 'wrapped2()'
                ]);
            });
        });

        describe("when onException !== null and exception is thrown", function () {
            it("should invoke onBefore() then throwex() then onException", function () {
                Class1.throwex = AL.Interceptor.before(Class2.onBefore, Class1.throwex, Class2.onException, Class2);
                expect(function () { Class1.throwex('A', 'B'); }).toThrow('throwex2');
                expect(order).toEqual([
                    { fn: 'onBefore()', args: ['A', 'B'] }, 'onBefore2()',
                    { fn: 'throwex()', args: ['A', 'B'] }, 'throwex2()',
                    { fn: 'onException()', args: ['throwex2', ['A', 'B']] }, 'onException2'
                ]);
            });
        });
    }); // .before()

    describe(".after()", function () {
        describe("with onException === null", function () {
            it("should invoke wrapped() then onAfter()", function () {
                Class1.wrapped = AL.Interceptor.after(Class1.wrapped, Class2.onAfter, null, Class2);
                Class1.wrapped('A', 'B');
                expect(order).toEqual([
                    { fn: 'wrapped()', args: ['A', 'B'] }, 'wrapped2()',
                    { fn: 'onAfter()', args: ['C', ['A', 'B']] }, 'onAfter2()'
                ]);
            });
        });

        describe("with onException !== null exception is not thrown", function () {
            it("should invoke wrapped() then onAfter()", function () {
                Class1.wrapped = AL.Interceptor.after(Class1.wrapped, Class2.onAfter, Class2.onException, Class2);
                Class1.wrapped('A', 'B');
                expect(order).toEqual([
                    { fn: 'wrapped()', args: ['A', 'B'] }, 'wrapped2()',
                    { fn: 'onAfter()', args: ['C', ['A', 'B']] }, 'onAfter2()'
                ]);
            });
        });

        describe("when onException !== null and exception is thrown", function () {
            it("should invoke throwex() then onException()", function () {
                Class1.throwex = AL.Interceptor.after(Class1.throwex, Class2.onAfter, Class2.onException, Class2);
                expect(function () { Class1.throwex('A', 'B'); }).toThrow('throwex2');
                expect(order).toEqual([
                    { fn: 'throwex()', args: ['A', 'B'] }, 'throwex2()',
                    { fn: 'onException()', args: ['throwex2', ['A', 'B']] }, 'onException2'
                ]);
            });
        });
    }); // .after()

});
