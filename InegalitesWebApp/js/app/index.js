/// <reference path="../../Scripts/typings/jquery/jquery.d.ts" />
/// <reference path="js/departements.ts" />
var dep;
var TypeAheadMatcher = (function () {
    function TypeAheadMatcher() {
    }
    TypeAheadMatcher.findMatches = function (q, cb) {
        var matches, substrRegex;

        var matchStrings = function (data) {
            if (!dep)
                dep = data; // caching datas;
            if (data != null) {
                matches = [];
                substrRegex = new RegExp(q, 'i');

                $.each(dep, function (i, str) {
                    if (substrRegex.test(str)) {
                        matches.push({ value: str });
                    }
                });

                cb(matches);
            }
        };

        if (!dep) {
            $.ajax("./datas/deplist.json", {
                success: function (data, status) {
                    console.log("request " + new Date());
                    matchStrings(data);
                }
            });
        } else {
            matchStrings(dep);
        }
    };
    return TypeAheadMatcher;
})();

var Main = (function () {
    function Main() {
    }
    Main.prototype.createTypeAhead = function () {
        var domInput = $("#searchDepartements");
        domInput.typeahead({
            hint: true,
            highlight: true,
            minLength: 2
        }, {
            displayKey: 'value',
            source: TypeAheadMatcher.findMatches
        });
        domInput.on("typeahead:selected", this.onSelectedDepartement);
    };

    Main.prototype.onSelectedDepartement = function (event) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            args[_i] = arguments[_i + 1];
        }
        if (args != null && args.length > 0) {
            var item = args[0];
            var itemValue = item.value || null;
            if (itemValue) {
                var arrayItemValue = itemValue.split(" - ");
                if (!arrayItemValue || arrayItemValue.length == 0)
                    throw "Can't parse item value " + itemValue + " / " + arrayItemValue;

                var hash = arrayItemValue[0];

                if (window.location.href.indexOf("departement") > 0) {
                    document.location.hash = hash + "-index";
                    main.buildPage();
                } else {
                    document.location.href = "departement.html#" + hash + "-intro";
                }
            }
        }
    };

    Main.prototype.buildPage = function () {
        var dep = new DepPageBuilder();
    };
    return Main;
})();
var main;
$(document).ready(function () {
    main = new Main();
    main.createTypeAhead();
    numeral.language('fr');
});
