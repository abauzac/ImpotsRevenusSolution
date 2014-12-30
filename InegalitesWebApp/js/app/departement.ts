﻿
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

class DepartementJSON {
    
    public Gini: any;
    public Lorenz: any;
    public Numero: any;
    public Moyennes: any;
    public Nom: any;

    public Data: any;
}

declare var numeral;

class DepPageBuilder {
    public depNumber: string = null;
    public pageName: string = null;
    public json: DepartementJSON = null; 

    public errorTpl: JQuery = $("<div>").html($("#errorTemplate").html());
    public introTpl: JQuery = $("<div>").html($("#depIntroTemplate").html());
    public tableDepYearTpl: JQuery = $("<div>").html($("#depIntroTableTempalte").html());
    

    public contentDiv: JQuery = $("#contentDiv");

    constructor() {
        var hash:string = window.location.hash;
        if (hash && hash.length > 0) {
            var hashParams = hash.split("-");

            if (hashParams.length == 2) {
                var depNumber = hashParams[0].replace("#", '');
                var pageType = hashParams[1];

                var url = "datas/departements/" + hashParams[0].replace("#", '') + ".json";
                console.log(url);

                $.ajax({
                    url: url,
                    success: (data: DepartementJSON, status) => {
                        this.json = data;

                        this.buildContent(pageType);
                    },
                    error: (xhr: JQueryXHR, status: string) => {
                        this.showErrorPage("Impossible de récupérer les données JSON<br />" +
                            "URL : datas/departements/" + hashParams[0] + ".json <br />" +
                            "Status requête : " + xhr.status);
                    }
                });
            } else {
                this.showErrorPage("Erreur : l'adresse URL ne semble pas correcte :s");
                
            }
        }
    }

    public buildContent(pagetype:string) {
        switch (pagetype) {
            case "intro":
                this.buildIntroPage();
                break;
            default:
                this.buildIntroPage();
        }
    }

    public buildIntroPage(): void {
        if (this.json) {
            var json = this.json;
            var clonedIntroTpl = this.introTpl.clone();
            clonedIntroTpl.find(".departement-intro__depName").prepend(json.Nom);

            for (var year = 2003; year <= 2012; year++) {
                var clonedTableTpl = this.tableDepYearTpl.clone();
                var depYear: DepartementYear = this.json.Data["" + year];
                clonedTableTpl.find(".intro-table__year").prepend(""+year);

                for (var tNum = 0; tNum < depYear.tranches.length; tNum++ ) {
                    var t: Tranche = depYear.tranches[tNum];
                    var rowString = "<tr>";
                    rowString += "<th scope='row'><small>" + t.trancheName + "<small></th>";
                    rowString += "<td>" + t.nbFoyers + "</td>";
                    rowString += "<td>" + numeral(t.revenus).format('0,0$') + "</td>";
                    rowString += "<td>" + numeral(t.impot).format('0,0$') + "</td>";
                    rowString += "<td>" + t.nbFoyersImposables + "</td>";
                    rowString += "<td>" + numeral(t.revenusImposables).format('0,0$') + "</td>";
                    rowString += "<td>" + t.nbFoyers_salaires + "</td>";
                    rowString += "<td>" + numeral(t.revenus_salaires).format('0,0$') + "</td>";
                    rowString += "<td>" + t.nbFoyers_retraites + "</td>";
                    rowString += "<td>" + numeral(t.revenus_retraites).format('0,0$') + "</td>";
                    rowString += "</tr>";
                    if (tNum == depYear.tranches.length - 1) {
                        rowString += "<tr>";
                        rowString += "<th scope='row'>Total </th>";
                        rowString += "<td>" + depYear.nbFoyers + "</td>";
                        rowString += "<td>" + numeral(depYear.revenus).format('0,0$') + "</td>";
                        rowString += "<td>" + numeral(depYear.impot).format('0,0$') + "</td>";
                        rowString += "<td>" + depYear.nbFoyersImposables + "</td>";
                        rowString += "<td>" + numeral(depYear.revenusImposables).format('0,0$') + "</td>";
                        rowString += "<td>" + depYear.nbFoyers_salaires + "</td>";
                        rowString += "<td>" + numeral(depYear.revenus_salaires).format('0,0$') + "</td>";
                        rowString += "<td>" + depYear.nbFoyers_retraites + "</td>";
                        rowString += "<td>" + numeral(depYear.revenus_retraites).format('0,0$') + "</td>";
                        rowString += "</tr>";
                    }
                    clonedTableTpl.find(".intro-table__tbody").append(rowString);
                }


                clonedIntroTpl.find(".departement-intro__table-container").append(clonedTableTpl);
            }


            this.contentDiv.empty().prepend(clonedIntroTpl.html());
        } else {
            this.showErrorPage("Impossible de récupérer les données JSON");
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