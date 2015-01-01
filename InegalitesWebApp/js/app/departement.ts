﻿
/// <reference path="../../Scripts/typings/jquery/jquery.d.ts" />
/// <reference path="index.ts" />
/// <reference path="models.ts" />


declare var numeral;



class DepPageBuilder implements IPageBuilder {
    public depNumber: string = null;
    public pageName: string = null;
    public json: DepartementJSON = null;
    public htmlLoaded: boolean = false;
    public menu: MenuDepartement = null;


    constructor(htmlLoaded: boolean) {
        this.htmlLoaded = htmlLoaded;
        var hash: string = window.location.hash;
        if (hash && hash.length > 0) {
            var hashParams = hash.split("-");

            if (hashParams.length == 2) {
                this.depNumber = hashParams[0].replace("#", '');
                this.pageName = hashParams[1];

            } else {
                new ErrorPage("Erreur : l'adresse URL ne semble pas correcte :s");

            }
        }
    }

    /**
     * build page when JSON has been requested
     */
    public buildPage() {

        // build menu gauche
        if (this.htmlLoaded) {
            this.menu.changeDepartement(this.depNumber);
        } else {
            this.menu = new MenuDepartement(this.depNumber);
            this.menu.build();
        }

        // build content

        var url = "datas/departements/" + this.depNumber + ".json";
        // if html not loaded : create menu

        $.ajax({
            url: url,
            success: (data: DepartementJSON, status) => {
                this.json = data;
                this.buildContentPage();
                this.htmlLoaded = true;
            },
            error: (xhr: JQueryXHR, status: string) => {
                new ErrorPage("Impossible de récupérer les données JSON<br />" +
                    "URL : datas/departements/" + this.depNumber + ".json <br />" +
                    "Status requête : " + xhr.status).build();
            }
        });



    }
    public buildContentPage() {

        var contentPage: ContentPage;

        switch (this.pageName) {
            case "intro":
                contentPage = new IntroPage(this.json);
                break;
            case "gini":
                contentPage = new GiniPage(this.json);
                break;
            case "moyennes":
                contentPage = new MoyennesPage(this.json);
                break;
            default:
                contentPage = new ErrorPage("Page not found : " + this.pageName);
        }

        contentPage.build();
    }


}



class MenuItem {
    public subItemList: MenuItem[] = [];
    public itemName: string = "";
    public depNumber: string = "";
    public pagetype: string = "";
    public clickCallBack: (event:JQueryEventObject) => void;
    constructor() {

    }

    public getFullDom():JQuery {
        var domItem = $("<a>");

        domItem.addClass("list-group-item");
        domItem.attr("href", "#" + this.depNumber + "-" + this.pagetype);
        domItem.attr("data-page", this.pagetype);
        domItem.attr("data-dep", this.depNumber);
        domItem.on("click", this.clickCallBack);
        domItem.html(this.itemName);

        return domItem;
    }
}

class MenuDepartement {
    public itemsList: MenuItem[] = [];
    public domMenu: JQuery = $(".menugauche");
    public depNumber: string = "";
    public items: JQuery = $([]);

    constructor(depNumber:string) {
        this.depNumber = depNumber;
    }

    public addMenuItem(name: string, depnumber?: string, pageType?:string, clickcb?: (event: JQueryEventObject) => void) {
        var item = new MenuItem();
        item.itemName = name;
        item.depNumber = depnumber;
        item.pagetype = pageType;
        item.clickCallBack = clickcb.bind(this);
        this.items = this.items.add(item.getFullDom());
        this.itemsList.push(item);
    }

    public build() {

        // create intro
        this.addMenuItem("Données brutes", this.depNumber, "intro", this.itemCallback);
        //create gini
        this.addMenuItem("Gini", this.depNumber, "gini", this.itemCallback);
        //create Lorenz
        this.addMenuItem("Lorenz", this.depNumber, "lorenz", this.itemCallback);
        // create Moyennes
        this.addMenuItem("Moyennes", this.depNumber , "moyennes", this.itemCallback);

        this.domMenu.empty().append(this.items);
    }



    public changeDepartement(depNumber: string) {
        for (var i = 0; i < this.items.length; i++) {
            var item = $(this.items[i]);
            item.attr("href", "#" + depNumber + "-" + item.attr("data-page"));
            item.attr("data-dep", depNumber);
        }
    }

    public itemCallback(event:JQueryEventObject) {
        var linkElem = event.target;
        this.items.removeClass("active");
        (<HTMLElement>linkElem).classList.add("active");
        main.pageBuilder.pageName = (<HTMLElement>linkElem).getAttribute("data-page");
        main.pageBuilder.buildContentPage();
    }

}

class IntroPage extends ContentPage  {
    public introTpl: JQuery = $("<div>").html($("#depIntroTemplate").html());
    public tableDepYearTpl: JQuery = $("<div>").html($("#depIntroTableTemplate").html());

    constructor(json: DepartementJSON) {
        super(json);
    }

    public build() {
        if (this.json) {
            var json = this.json;
            var clonedIntroTpl = this.introTpl.clone();
            clonedIntroTpl.find(".departement__depName").prepend(json.Nom);


            for (var year = 2003; year <= 2012; year++) {
                var clonedTableTpl = this.tableDepYearTpl.clone();
                clonedTableTpl.find(".intro-table__year").prepend("" + year);

                this.createTable(this.json.Data["" + year], clonedTableTpl);

                clonedIntroTpl.find(".departement-intro__table-container").prepend(clonedTableTpl);
            }


            this.contentDiv.empty().prepend(clonedIntroTpl.html());
        } else {
            this.showErrorPage("Impossible de récupérer les données JSON");
        }
    }

    public getValueFormatted(value: number, isDevise: boolean= true): string {
        if (!value) return "";

        if (value == -1) {
            return "n.d.";
        } else {
            if (isDevise) {
                return numeral(value).format('0,0$');
            } else {
                return value.toString();
            }
        }
    }

    private createTable(depYear: DepartementYear, clonedTableTpl: JQuery) {

        for (var tNum = 0; tNum < depYear.tranches.length; tNum++) {
            var t: Tranche = depYear.tranches[tNum];
            var rowString = "<tr>";
            rowString += "<th scope='row'><small>" + t.trancheName + "<small></th>";
            rowString += "<td>" + this.getValueFormatted(t.nbFoyers, false) + "</td>";
            rowString += "<td>" + this.getValueFormatted(t.revenus) + "</td>";
            rowString += "<td>" + this.getValueFormatted(t.impot) + "</td>";
            rowString += "<td>" + this.getValueFormatted(t.nbFoyersImposables, false) + "</td>";
            rowString += "<td>" + this.getValueFormatted(t.revenusImposables) + "</td>";
            rowString += "<td>" + this.getValueFormatted(t.nbFoyers_salaires, false) + "</td>";
            rowString += "<td>" + this.getValueFormatted(t.revenus_salaires) + "</td>";
            rowString += "<td>" + this.getValueFormatted(t.nbFoyers_retraites, false) + "</td>";
            rowString += "<td>" + this.getValueFormatted(t.revenus_retraites) + "</td>";
            rowString += "</tr>";
            if (tNum == depYear.tranches.length - 1) {
                rowString += "<tr>";
                rowString += "<th scope='row'>Total </th>";
                rowString += "<td>" + this.getValueFormatted(depYear.nbFoyers, false) + "</td>";
                rowString += "<td>" + this.getValueFormatted(depYear.revenus) + "</td>";
                rowString += "<td>" + this.getValueFormatted(depYear.impot) + "</td>";
                rowString += "<td>" + this.getValueFormatted(depYear.nbFoyersImposables, false) + "</td>";
                rowString += "<td>" + this.getValueFormatted(depYear.revenusImposables) + "</td>";
                rowString += "<td>" + this.getValueFormatted(depYear.nbFoyers_salaires, false) + "</td>";
                rowString += "<td>" + this.getValueFormatted(depYear.revenus_salaires) + "</td>";
                rowString += "<td>" + this.getValueFormatted(depYear.nbFoyers_retraites, false) + "</td>";
                rowString += "<td>" + this.getValueFormatted(depYear.revenus_retraites) + "</td>";
                rowString += "</tr>";
            }
            clonedTableTpl.find(".intro-table__tbody").append(rowString);
        }
    }
}

class GiniPage extends ContentPage {

    public giniTpl = $("<div>").html($("#depGiniTemplate").html());

    constructor(json:DepartementJSON) {
        super(json);
    }


    public build() {
        if (this.json) {
            var json = this.json;
            var clonedIntroTpl = this.giniTpl.clone();
            clonedIntroTpl.find(".departement__depName").prepend(json.Nom);

            this.contentDiv.empty().prepend(clonedIntroTpl.html());

            this.createChart(this.json.Gini);

        } else {
            this.showErrorPage("Impossible de récupérer les données JSON");
        }
    }

    private createChart(gini: Object) {

        var labels = [];
        var series = [[]];

        for (var year in gini) {
            if (gini.hasOwnProperty(year)) {

                labels.push(year);
                series[0].push(gini[year]);

            }
        }
        // Create a simple line chart
        var data = {
            // A labels array that can contain any sort of values
            labels: labels,
            // Our series array that contains series objects or in this case series data arrays
            series: series
        };

        var options = {
            width: '480px',
            height: '320px',
            axisY: {
                labelInterpolationFnc: function (value) {
                    return (Math.round(value * 1000) / 1000).toFixed(3);
                },
            }
        };


        // In the global name space Chartist we call the Line function to initialize a line chart. 
        //As a first parameter we pass in a selector where we would like to get our chart created.
        //Second parameter is the actual data object and as a 
        //third parameter we pass in our options
        new Chartist.Line('.ct-chart', data, options);
    }

}


class MoyennesPage extends ContentPage {
    public moyTpl = $("<div>").html($("#depMoyennesTemplate").html());
    
    constructor(json: DepartementJSON) {
        super(json);
    }

    public build() {
        if (this.json) {
            var json = this.json;
            var clonedIntroTpl = this.moyTpl.clone();
            clonedIntroTpl.find(".departement__depName").prepend(json.Nom);

            this.contentDiv.empty().prepend(clonedIntroTpl.html());

            this.createChart(this.json.Moyennes);
        }
    }

    private createChart(moy: Object) {
        var labels = [];
        var series = [[]];

        for (var year in moy) {
            // on commence à 2006 (loi finance 2006 change tout)
            if (parseInt(year) >= 2006) {
                if (moy.hasOwnProperty(year)) {

                    labels.push(year);
                    series[0].push(moy[year]);

                }
            }
           
        }
        // Create a simple line chart
        var data = {
            // A labels array that can contain any sort of values
            labels: labels,
            // Our series array that contains series objects or in this case series data arrays
            series: series
        };

        var options = {
            width: '480px',
            height: '320px'
        };


        // In the global name space Chartist we call the Line function to initialize a line chart. 
        //As a first parameter we pass in a selector where we would like to get our chart created.
        //Second parameter is the actual data object and as a 
        //third parameter we pass in our options
        new Chartist.Line('.ct-chart', data, options);
    }
}

$(document).ready(function () {
    main.pageBuilder = new DepPageBuilder(false);
    main.pageBuilder.buildPage();
});