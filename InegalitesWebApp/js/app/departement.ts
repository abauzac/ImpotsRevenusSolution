
/// <reference path="../../Scripts/typings/jquery/jquery.d.ts" />
/// <reference path="index.ts" />

class Tranche {
    public trancheName: string;
    public trancheMin: number;
    public trancheMax: number;
    public nbFoyers: number;
    public nbFoyersImposables: number;
    public revenus: number;
    public revenusImposables: number;
    public impot: number;
    public nbFoyers_salaires: number;
    public revenus_salaires: number;
    public nbFoyers_retraites: number;
    public revenus_retraites: number;

}

/**
 * Within DepartementJSON.Data[YEAR]
 */
class DepartementYear {
    public depNumber: string;
    public depName: string;
    public year: number;
    public tranches: Tranche[];

}

class DepartementJSON {
    
    public Gini: any;
    public Lorenz: any;
    public Numero: any;
    public Moyennes: any;
    public Nom: any;

    public Data: any;
}

class DepPageBuilder {
    public depNumber: string = null;
    public pageName: string = null;
    public json: DepartementJSON = null; 

    public errorTpl: JQuery = $($("#errorTemplate").text().trim());

    public contentDiv: JQuery = $("#contentDiv");

    constructor() {
        var hash:string = window.location.hash;
        if (hash && hash.length > 0) {
            var hashParams = hash.split("-");

            if (hashParams.length > 0) {
                var url = "datas/departements/" + hashParams[0].replace("#", '') + ".json";
                console.log(url);

                $.ajax({
                    url: url,
                    success: (data: DepartementJSON, status) => {
                        this.json = data;
                        this.buildIntroPage();
                    },
                    error: (xhr: JQueryXHR, status: string) => {
                        console.log("fail datas/departements/" + hashParams[0] + ".json");
                        console.log("fail : " + xhr.status);
                    }
                });
            }
        }
    }

    public buildIntroPage(): void {
        this.showErrorPage("tototo");
        if (this.json) {
           

        } else {

        }
    }

    public showErrorPage(message: string) {

        var clonedTpl = this.errorTpl.clone();

        clonedTpl.find("#errorTextId").prepend("<p>" +  message +"<p>");
        this.contentDiv.empty().prepend(clonedTpl.html());
    }

}


$(document).ready(function () {
    main.buildPage();
});