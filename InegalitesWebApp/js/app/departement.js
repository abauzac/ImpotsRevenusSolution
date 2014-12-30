/// <reference path="../../Scripts/typings/jquery/jquery.d.ts" />
/// <reference path="index.ts" />
var Tranche = (function () {
    function Tranche() {
    }
    return Tranche;
})();

/**
* Within DepartementJSON.Data[YEAR]
*/
var DepartementYear = (function () {
    function DepartementYear() {
    }
    return DepartementYear;
})();

var DepartementJSON = (function () {
    function DepartementJSON() {
    }
    return DepartementJSON;
})();

var DepPageBuilder = (function () {
    function DepPageBuilder() {
        var _this = this;
        this.depNumber = null;
        this.pageName = null;
        this.json = null;
        this.errorTpl = $("<div>").html($("#errorTemplate").html());
        this.introTpl = $("<div>").html($("#depIntroTemplate").html());
        this.tableDepYearTpl = $("<div>").html($("#depIntroTableTempalte").html());
        this.contentDiv = $("#contentDiv");
        var hash = window.location.hash;
        if (hash && hash.length > 0) {
            var hashParams = hash.split("-");

            if (hashParams.length == 2) {
                var depNumber = hashParams[0].replace("#", '');
                var pageType = hashParams[1];

                var url = "datas/departements/" + hashParams[0].replace("#", '') + ".json";
                console.log(url);

                $.ajax({
                    url: url,
                    success: function (data, status) {
                        _this.json = data;

                        _this.buildContent(pageType);
                    },
                    error: function (xhr, status) {
                        _this.showErrorPage("Impossible de récupérer les données JSON<br />" + "URL : datas/departements/" + hashParams[0] + ".json <br />" + "Status requête : " + xhr.status);
                    }
                });
            } else {
                this.showErrorPage("Erreur : l'adresse URL ne semble pas correcte :s");
            }
        }
    }
    DepPageBuilder.prototype.buildContent = function (pagetype) {
        switch (pagetype) {
            case "intro":
                this.buildIntroPage();
                break;
            default:
                this.buildIntroPage();
        }
    };

    DepPageBuilder.prototype.buildIntroPage = function () {
        if (this.json) {
            var json = this.json;
            var clonedIntroTpl = this.introTpl.clone();
            clonedIntroTpl.find(".departement-intro__depName").prepend(json.Nom);

            for (var year = 2003; year <= 2012; year++) {
                var clonedTableTpl = this.tableDepYearTpl.clone();
                var depYear = this.json.Data["" + year];
                clonedTableTpl.find(".intro-table__year").prepend("" + year);

                for (var tNum = 0; tNum < depYear.tranches.length; tNum++) {
                    var t = depYear.tranches[tNum];
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
    };

    DepPageBuilder.prototype.showErrorPage = function (message) {
        var clonedTpl = this.errorTpl.clone();

        clonedTpl.find("#errorTextId").prepend("<p>" + message + "<p>");
        this.contentDiv.empty().prepend(clonedTpl.html());
    };
    return DepPageBuilder;
})();

$(document).ready(function () {
    main.buildPage();
});
