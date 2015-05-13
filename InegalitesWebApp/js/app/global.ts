/// <reference path="../../Scripts/typings/jquery/jquery.d.ts" />
/// <reference path="departement.ts" />

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

interface IPageBuilder {
    buildPage(): void;
    buildContentPage(): void;
    pageName: string;
    setPageName(pagename: string): void;
}


class Main {

    private substringmatch: TypeAheadMatcher;
    public pageBuilder: IPageBuilder = null;


    constructor() {
       
    }

    public createTypeAhead() {
        var domInput = $("#searchDepartements");
        (<any>domInput).typeahead(
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

                var depNumber:string = arrayItemValue[0];

                if (window.location.href.indexOf("departement") > 0) {
                    if (!main.pageBuilder.pageName)  { // on connait pas la page : redir vers intro
                        main.pageBuilder.pageName = "intro";
                    }
                    document.location.hash = depNumber + "-" + main.pageBuilder.pageName;
                    (<DepPageBuilder>main.pageBuilder).depNumber = depNumber;

                    main.pageBuilder.buildPage();

                    $(event.target).val("");
                } else { // redirect
                    document.location.href = "departement.html#" + depNumber + "-intro";
                }

            }

        }
    }

}

class ContentPage {

    public contentDiv: JQuery = $("#contentDiv");
    public json: any = null;

    constructor(json: any) {
        
        this.json = json;
    }

    public build() {

    }


    public buildMenu() {

    }

    public showErrorPage(message: string) {

        new ErrorPage(message).build();
    }

}

class ErrorPage extends ContentPage {

    public errorTpl: JQuery = $("<div>").html($("#errorTemplate").html());
    public message = "";

    constructor(errorMsg: string) {
        super(null);
        this.message = errorMsg;
    }

    public build() {
        var clonedTpl = this.errorTpl.clone();

        clonedTpl.find("#errorTextId").prepend("<p>" + this.message + "<p>");
        this.contentDiv.empty().prepend(clonedTpl.html());
    }

}

var main:Main;
$(document).ready(() => {

    main = new Main();
    main.createTypeAhead();
    //numeral.language('fr');
    //main.pageBuilder.buildPage();
});

