/// <reference path="../../Scripts/typings/jquery/jquery.d.ts" />
/// <reference path="departement.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
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
        this.pageBuilder = null;
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

                var depNumber = arrayItemValue[0];

                if (window.location.href.indexOf("departement") > 0) {
                    if (!main.pageBuilder.pageName) {
                        main.pageBuilder.pageName = "intro";
                    }
                    document.location.hash = depNumber + "-" + main.pageBuilder.pageName;
                    main.pageBuilder.depNumber = depNumber;

                    main.pageBuilder.buildPage();

                    $(event.target).val("");
                } else {
                    document.location.href = "departement.html#" + depNumber + "-intro";
                }
            }
        }
    };
    return Main;
})();

var ContentPage = (function () {
    function ContentPage(json) {
        this.contentDiv = $("#contentDiv");
        this.json = null;
        this.json = json;
    }
    ContentPage.prototype.build = function () {
    };

    ContentPage.prototype.buildMenu = function () {
    };

    ContentPage.prototype.showErrorPage = function (message) {
        new ErrorPage(message).build();
    };
    return ContentPage;
})();

var ErrorPage = (function (_super) {
    __extends(ErrorPage, _super);
    function ErrorPage(errorMsg) {
        _super.call(this, null);
        this.errorTpl = $("<div>").html($("#errorTemplate").html());
        this.message = "";
        this.message = errorMsg;
    }
    ErrorPage.prototype.build = function () {
        var clonedTpl = this.errorTpl.clone();

        clonedTpl.find("#errorTextId").prepend("<p>" + this.message + "<p>");
        this.contentDiv.empty().prepend(clonedTpl.html());
    };
    return ErrorPage;
})(ContentPage);

var main;
$(document).ready(function () {
    main = new Main();
    main.createTypeAhead();
    //numeral.language('fr');
    //main.pageBuilder.buildPage();
});
