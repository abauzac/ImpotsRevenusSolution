/// <reference path="../../Scripts/typings/jquery/jquery.d.ts" />
/// <reference path="departements.ts" />

var dep;
class TypeAheadMatcher {

    public static findMatches(q: string, cb: (a: Array<any>) => void) {

        var matches, substrRegex;

        var matchStrings = function (data) {

            if (!dep) dep = data; // caching datas;
            if (data != null) {
                matches = [];
                substrRegex = new RegExp(q, 'i');

                $.each(dep, function (i, str: string) {
                    if (substrRegex.test(str)) {
                        matches.push({ value: str });
                    }
                });

                cb(matches);
            }
        }

        if (!dep) {

            $.ajax("./datas/deplist.json", {
                success: (data: any, status: string) => {
                    console.log("request " + new Date());
                    matchStrings(data);
                    
                }
            });
        } else {
            matchStrings(dep);
        }

        
    }



}

class Main {

    private substringmatch: TypeAheadMatcher;

    constructor() {
    }

    public createTypeAhead() {
        var domInput = $("#searchDepartements");
        domInput.typeahead(
            {
                hint: true,
                highlight: true,
                minLength: 2
            },
            {
                displayKey: 'value',
                source: TypeAheadMatcher.findMatches
            });
        domInput.on("typeahead:selected", this.onSelectedDepartement);
        
    }

    private onSelectedDepartement(event: JQueryEventObject, ...args: any[]):void {
        if (args != null && args.length > 0) {
            var item = args[0];
            var itemValue:string = item.value || null;
            if (itemValue) {

                var arrayItemValue: string[] = itemValue.split(" - ");
                if (!arrayItemValue || arrayItemValue.length == 0) throw "Can't parse item value " + itemValue + " / " + arrayItemValue;

                var hash:string = arrayItemValue[0];

                if (window.location.href.indexOf("departement") > 0) {
                    document.location.hash = hash + "-index";
                    main.buildPage();
                } else { // redirect
                    document.location.href = "departement.html#" + hash + "-index";
                }

            }

        }
    }

    public buildPage() {
        var dep = new DepPageBuilder();
    }
}
var main:Main;
$(document).ready(() => {

    main = new Main();
    main.createTypeAhead();
});

