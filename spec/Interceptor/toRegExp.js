Ext.define('AL.spec.Interceptor.toRegExp', {});

describe("AL.Interceptor.toRegExp()", function() {
    var list1 = ["", "1", "ABC", "ABCDEFG", "AB.D.FG", "BCD", "DEF"];

    // Helper to check sets of values
    var matches = function(pattern, values) {
        var regex = AL.Interceptor.toRegExp(pattern);
        //console.log(regex);
        return values.filter(function(x) {
            return x.match(regex);
        });
    };

    it("is a static function", function() {
        expect(typeof AL.Interceptor.toRegExp).toBe('function');
    });

    it("null should match ALL", function() {
        expect(matches(null, list1)).toEqual(list1);
    });

    it("true should match ALL", function() {
        expect(matches(null, list1)).toEqual(list1);
    });

    it("false should match NONE", function() {
        expect(matches(false, list1)).toEqual([]);
    });

    it("non empty string should match exactly", function() {
        expect(matches("ABC", list1)).toEqual(["ABC"]);
    });

    it("string containing multiple '.'s should match exactly", function() {
        expect(matches("AB.D.FG", list1)).toEqual(["AB.D.FG"]);
    });

    it("array string containing multiple '.'s should match exactly", function() {
        expect(matches(["AB.D.FG"], list1)).toEqual(["AB.D.FG"]);
    });

    it("pattern containing multiple '.'s should match using regex", function() {
        expect(matches(/AB.D.FG/, list1)).toEqual(["ABCDEFG", "AB.D.FG"]);
    });

    it("empty string should match exactly", function() {
        expect(matches("", list1)).toEqual([""]);
    });

    it("array should match each value", function() {
        expect(matches(["ABC", ""], list1)).toEqual(["", "ABC"]);
    });

    it("RegExp should match as a regex pattern", function() {
        expect(matches(/^AB/, list1)).toEqual(["ABC", "ABCDEFG", "AB.D.FG"]);
    });
});
