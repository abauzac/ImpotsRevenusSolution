
/// <reference path="../../Scripts/typings/jquery/jquery.d.ts" />
/// <reference path="global.ts" />
/// <reference path="models.ts" />


declare var numeral;
declare var Chartist;


class DepPageBuilder implements IPageBuilder {
    public depNumber: string = null;
    public pageName: string = null;
    public json: DepartementJSON = null;
    public htmlLoaded: boolean = false;
    public menu: MenuDepartement = null;
    public domDepName = $(".content-wrapper .departement__depName");

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

        this.domDepName.text(this.json.Nom);
        document.title = this.json.Nom;

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
            case "lorenz":
                contentPage = new LorenzPage(this.json);
                break;
            case "seuils":
                contentPage = new SeuilsPage(this.json);
                break;
            case "impots":
                contentPage = new ImpotsPage(this.json);
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
    public clickCallBack: (event: JQueryEventObject) => void;
    constructor() {

    }

    public getFullDom(): JQuery {
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

    constructor(depNumber: string) {
        this.depNumber = depNumber;
    }

    public addMenuItem(name: string, depnumber?: string, pageType?: string, clickcb?: (event: JQueryEventObject) => void) {
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
        this.addMenuItem("Moyennes", this.depNumber, "moyennes", this.itemCallback);
        // create Moyennes
        this.addMenuItem("Seuils des revenus", this.depNumber, "seuils", this.itemCallback);
        // create Impots
        this.addMenuItem("Impots", this.depNumber, "impots", this.itemCallback);

        this.domMenu.empty().append(this.items);
    }



    public changeDepartement(depNumber: string) {
        for (var i = 0; i < this.items.length; i++) {
            var item = $(this.items[i]);
            item.attr("href", "#" + depNumber + "-" + item.attr("data-page"));
            item.attr("data-dep", depNumber);
        }
    }

    public itemCallback(event: JQueryEventObject) {
        var linkElem = event.target;
        this.items.removeClass("active");
        (<HTMLElement>linkElem).classList.add("active");
        main.pageBuilder.pageName = (<HTMLElement>linkElem).getAttribute("data-page");
        main.pageBuilder.buildContentPage();
    }

}

class IntroPage extends ContentPage {
    public introTpl: JQuery = $("<div>").html($("#depIntroTemplate").html());
    public tableDepYearTpl: JQuery = $("<div>").html($("#depIntroTableTemplate").html());

    constructor(json: DepartementJSON) {
        super(json);
    }

    public build() {
        if (this.json) {
            var json = this.json;
            var clonedIntroTpl = this.introTpl.clone();


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

    constructor(json: DepartementJSON) {
        super(json);
    }


    public build() {
        if (this.json) {
            var json = this.json;
            var clonedIntroTpl = this.giniTpl.clone();

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
            //width: '480px',
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

            this.contentDiv.empty().prepend(clonedIntroTpl.html());

            this.createChartMoyennes(this.json.Moyennes);

            this.createChartMoyInflations(this.json.Moyennes);
        }
    }

    private createChartMoyInflations(moyennes: Object) {
        var baseDep = 100;
        var baseInfla = 100;
        var infla = [1.5, 2.8, 0.1, 1.5, 2.1, 2];
        var labels = [];
        var series = [[], []];
        // moyennes
        for (var year in moyennes) {
            if (parseInt(year) >= 2006) {
                labels.push(year);
                series[0].push(moyennes[year] / moyennes["2006"] * 100);
            }
        }

        // inflation
        series[1].push(100);
        var previous = 100;
        for (var i = 0; i < infla.length; i++) {
            previous = previous * (100 + infla[i]) / 100
            series[1].push(previous);
        }

        var data = {
            // A labels array that can contain any sort of values
            labels: labels,
            // Our series array that contains series objects or in this case series data arrays
            series: series
        };

        var options = {
            //  width: '480px',
            height: '320px'
        };


        // In the global name space Chartist we call the Line function to initialize a line chart. 
        //As a first parameter we pass in a selector where we would like to get our chart created.
        //Second parameter is the actual data object and as a 
        //third parameter we pass in our options
        new Chartist.Line('.ct-chart-infla', data, options);

    }

    private createChartMoyennes(moy: Object) {
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
        var data = {
            labels: labels,
            series: series
        };

        var options = {
            //  width: '480px',
            height: '320px'
        };


        new Chartist.Line('.ct-chart-moy', data, options);
    }
}


class LorenzPage extends ContentPage {
    public lorenzTpl = $("<div>").html($("#depLorenzTemplate").html());
    public clonedTpl: JQuery;
    public year;
    public chartClass = '.ct-chart-lorenz';
    public dataChart;
    public optionsChart;
    public chartist;
    constructor(json: DepartementJSON) {
        super(json);
    }

    public build() {
        if (this.json) {
            var json = this.json;

            this.createChart(this.json.Lorenz);
            this.updateTexts(this.json.Lorenz);
            this.insertChart();
        }
    }

    private updateTexts(lorenz: LorenzJSON) {
        var lorenzCurve: any[] = lorenz.LorenzDeciles[this.year];
        var valeurMiddle = Math.round(lorenzCurve.length / 2);
        if (!this.chartist) {
            this.clonedTpl.find(".lecturePop").text((Math.round(lorenzCurve[valeurMiddle].Key * 100)).toFixed(1));
            this.clonedTpl.find(".lectureRev").text((Math.round(lorenzCurve[valeurMiddle].Value * 100)).toFixed(1));
        } else {
            this.contentDiv.find(".lecturePop").text((Math.round(lorenzCurve[valeurMiddle].Key * 100)).toFixed(1));
            this.contentDiv.find(".lectureRev").text((Math.round(lorenzCurve[valeurMiddle].Value * 100)).toFixed(1));
        }

    }
    private createChart(lorenz: LorenzJSON) {
        this.clonedTpl = this.lorenzTpl.clone();
        var labels = [];
        var series = [[]];

        if (!this.year) {
            this.year = "2012";
        }

        if (!this.chartist)
            this.buildDropDown(lorenz.LorenzDeciles);

        var lorenzCurve: any[] = lorenz.LorenzDeciles[this.year];

        for (var i = 0, j = lorenzCurve.length; i < j; i++) {

            labels.push((Math.round(lorenzCurve[i].Key * 100)).toFixed(1));
            series[0].push((Math.round(lorenzCurve[i].Value * 100)).toFixed(1));
        }



        this.dataChart = {
            labels: labels,
            series: series
        };

        this.optionsChart = {
            width: '320px',
            height: '320px',
            axisY: {
                labelOffset: {
                    y: 10
                }
            },
            scaleAxis: true
        };
        lorenzCurve = null;

    }

    public buildDropDown(trancheEveryYears) {
        var ulDropDown = this.clonedTpl.find("#dropDownLorenzYears");
        //  <li role="presentation"><a role="menuitem" tabindex="-1" href="#">Another action</a></li>

        for (var year in trancheEveryYears) {
            var dom = document.createElement("a");
            dom.setAttribute("role", "menuitem");
            dom.setAttribute("tabindex", "-1");
            dom.setAttribute("data-year", "" + year);
            dom.setAttribute("href", "#" + this.json.Numero + "-lorenz");
            dom.textContent = year;

            var li = document.createElement("li");

            li.appendChild(dom);

            ulDropDown.prepend($(li));
        }


        this.contentDiv.on("click", "#dropDownLorenzYears a", this.clickDropDown.bind(this));
    }

    public clickDropDown(event: JQueryEventObject) {
        this.year = $(event.target).attr("data-year");
        this.contentDiv.find("#dropDownLorenzBtn").text(this.year);
        this.build();
    }

    public insertChart() {

        // juste update the chart if it already exists
        if (!this.chartist) {
            this.contentDiv.empty().prepend(this.clonedTpl.html());
            this.chartist = new Chartist.Line('.ct-chart-lorenz', this.dataChart, this.optionsChart);
        } else {
            this.chartist.update(this.dataChart);
        }
    }
}

class SeuilsPage extends ContentPage {
    public seuilsTpl = $("<div>").html($("#depSeuilsTemplate").html());

    constructor(json: DepartementJSON) {
        super(json);
    }


    public build() {
        if (this.json) {
            var json = this.json;
            var clonedIntroTpl = this.seuilsTpl.clone();

            this.contentDiv.empty().prepend(clonedIntroTpl.html());

            this.createChartSeuilsLorenz(this.json.Lorenz.LorenzDeciles);

            this.createChartSeuilsRevenus(this.json);

            this.createChartSeuilsBase(this.json);

        } else {
            this.showErrorPage("Impossible de récupérer les données JSON");
        }
    }

    public createChartSeuilsBase(json: DepartementJSON) {
        var baseDep = 100;
        var baseInfla = 100;
        var infla = [0, 1.5, 2.8, 0.1, 1.5, 2.1, 2];
        var labels = [];
        var series = [[], [], []];

        var lorenzDeciles = json.Lorenz.LorenzDeciles;
        var data = json.Data;

        var totalPopBase = (<DepartementYear>data["2006"]).nbFoyers;
        var totalRevBase = (<DepartementYear>data["2006"]).revenus;

        var base50 = (lorenzDeciles["2006"][10].Value * totalRevBase) / (totalPopBase * 0.5);
        var base30 = (lorenzDeciles["2006"][16].Value * totalRevBase - lorenzDeciles["2006"][10].Value * totalRevBase) / (totalPopBase * 0.3);
        var base20 = (totalRevBase - lorenzDeciles["2006"][16].Value * totalRevBase - lorenzDeciles["2006"][10].Value * totalRevBase) / (totalPopBase * 0.2);

        var i = 0;
        for (var year in lorenzDeciles) {
            if (parseInt(year) >= 2006) {

                labels.push(year);

                var totalPop = (<DepartementYear>data[year]).nbFoyers;
                var totalRev = (<DepartementYear>data[year]).revenus;
                var revProp50 = lorenzDeciles[year][10].Value;
                var revProp80 = lorenzDeciles[year][16].Value;

                var revMoy50 = (revProp50 * totalRev) / (totalPop * 0.5);

                series[0].push(revMoy50 / base50 * 100);

                var revMoy30 = (revProp80 * totalRev - revProp50 * totalRev) / (totalPop * 0.3);

                series[1].push(revMoy30 / base30 * 100);

                var revMoy20 = (totalRev - revProp80 * totalRev - revProp50 * totalRev) / (totalPop * 0.2);

                series[2].push(revMoy20 / base20 * 100);

                //baseInfla = baseInfla * ((100 + infla[i]) / 100);
                //series[3].push(baseInfla);
                //i++;

            }
        }

        var datachart = {
            // A labels array that can contain any sort of values
            labels: labels,
            // Our series array that contains series objects or in this case series data arrays
            series: series
        };

        var options = {
            //  width: '480px',
            height: '320px',
        };


        // In the global name space Chartist we call the Line function to initialize a line chart. 
        //As a first parameter we pass in a selector where we would like to get our chart created.
        //Second parameter is the actual data object and as a 
        //third parameter we pass in our options
        new Chartist.Line('.ct-chart-seuils-base', datachart, options);
    }

    public createChartSeuilsRevenus(json: DepartementJSON) {
        var baseDep = 100;
        var baseInfla = 100;
        var labels = [];
        var series = [[], [], []];

        var lorenzDeciles = json.Lorenz.LorenzDeciles;
        var data = json.Data;

        var base50, base30, base20;

        for (var year in lorenzDeciles) {
            if (year && parseInt(year) >= 2006) {
                labels.push(year);
                var revProp50 = lorenzDeciles[year][10].Value;
                var revProp80 = lorenzDeciles[year][16].Value;
                var totalRev = (<DepartementYear>data[year]).revenus;
                var totalPop = (<DepartementYear>data[year]).nbFoyers;

                var revMoy50 = (revProp50 * totalRev) / (totalPop * 0.5);

                series[0].push(revMoy50);

                var revMoy30 = (revProp80 * totalRev - revProp50 * totalRev) / (totalPop * 0.3);

                series[1].push(revMoy30);

                var revMoy20 = (totalRev - revProp80 * totalRev - revProp50 * totalRev) / (totalPop * 0.2);

                series[2].push(revMoy20);




            }
        }

        var datachart = {
            // A labels array that can contain any sort of values
            labels: labels,
            // Our series array that contains series objects or in this case series data arrays
            series: series
        };

        var options = {
            //  width: '480px',
            height: '320px',
            low: 0
        };


        // In the global name space Chartist we call the Line function to initialize a line chart. 
        //As a first parameter we pass in a selector where we would like to get our chart created.
        //Second parameter is the actual data object and as a 
        //third parameter we pass in our options
        new Chartist.Line('.ct-chart-seuils-rev', datachart, options);
    }

    public createChartSeuilsLorenz(lorenzDeciles: any) {
        var baseDep = 100;
        var baseInfla = 100;
        //var infla = [1.6, 1.5, 2.8, 0.1, 1.5, 2.1, 2];
        var labels = [];
        var series = [[], []];
        for (var year in lorenzDeciles) {
            if (year) {
                labels.push(year);
                series[0].push((lorenzDeciles[year][10].Value * 100).toFixed(2));
                series[1].push((lorenzDeciles[year][16].Value * 100).toFixed(2));
            }

            if (year == 2012) {
                this.contentDiv.find(".seuils-text-revenus-prop").text((lorenzDeciles[year][10].Value * 100).toFixed(2));
            }
        }

        var data = {
            // A labels array that can contain any sort of values
            labels: labels,
            // Our series array that contains series objects or in this case series data arrays
            series: series
        };

        var options = {
            //  width: '480px',
            height: '320px',
            showArea: true,
            low: 0,
            axisY: {
                labelInterpolationFnc: function (value) {
                    return value + "%";
                },
            }
        };


        // In the global name space Chartist we call the Line function to initialize a line chart. 
        //As a first parameter we pass in a selector where we would like to get our chart created.
        //Second parameter is the actual data object and as a 
        //third parameter we pass in our options
        new Chartist.Line('.ct-chart-seuils', data, options);
    }
}


class ImpotsPage extends ContentPage {
    public impotsTpl: JQuery = $("<div>").html($("#depImpotsTemplate").html());

    constructor(json: DepartementJSON) {
        super(json);
    }

    public build() {
        if (this.json) {
            var json = this.json;
            var clonedIntroTpl = this.impotsTpl.clone();

            this.contentDiv.empty().prepend(clonedIntroTpl.html());


            this.createChartImpotsMoyensParFoyer();

            this.createChartEvolutionTotalImpot();

            this.createChartPropFoyersImposables();
        }
    }

   

    public createChartImpotsMoyensParFoyer() {
        var labels = [];
        var series = [[], []];
        var datajson = this.json.Data;
        for (var year in datajson) {
            if (datajson.hasOwnProperty(year)) {
                var datayear: DepartementYear = datajson[year];
                datayear.revenus
                labels.push(year);
                var impots = 0;
                for (var i = 0; i < datayear.tranches.length; i++) {
                    if (datayear.tranches[i].impot > 0)
                        impots += datayear.tranches[i].impot;
                }

                series[0].push((impots / datayear.nbFoyersImposables).toFixed(1));
                series[1].push((datayear.impot / datayear.nbFoyers).toFixed(1));

            }

        }
        var data = { labels: labels, series: series };

        var options = { height: '320px' };


        new Chartist.Line('.ct-chart-impots__moyennne-foyer', data, options);
    }

    public createChartPropFoyersImposables() {
        var labels = [];
        var series = [[]];
        var datajson = this.json.Data;
        for (var year in datajson) {
            if (datajson.hasOwnProperty(year)) {
                var datayear: DepartementYear = datajson[year];
                datayear.revenus
                labels.push(year);
                series[0].push((datayear.nbFoyersImposables / datayear.nbFoyers * 100).toFixed(1));

            }

        }
        var data = { labels: labels, series: series };

        var options = { height: '320px' };


        new Chartist.Line('.ct-chart-impots__foyers-imposables', data, options);
    }

    public createChartEvolutionTotalImpot() {
        var labels = [];
        var series = [[], []];
        var datajson = this.json.Data;
        var impotTotalBaseYear;
        var foyerTotalBaseYear;
        for (var year in datajson) {
            if (datajson.hasOwnProperty(year)) {

                var datayear: DepartementYear = datajson[year];
                if (year == "2003") {
                    impotTotalBaseYear = datayear.impot;
                    foyerTotalBaseYear = datayear.nbFoyers;
                    labels.push(year);
                    series[0].push(100);
                    series[1].push(100);
                } else {
                    datayear.revenus
                    labels.push(year);
                    series[0].push((datayear.impot / impotTotalBaseYear * 100).toFixed(1));
                    series[1].push((datayear.nbFoyers / foyerTotalBaseYear * 100).toFixed(1));
                }
            }
        }
        var data = { labels: labels, series: series };

        var options = { height: '320px' };


        new Chartist.Line('.ct-chart-impots__evo-total', data, options);
    }
}
$(document).ready(function () {
    numeral.language('fr');
    main.pageBuilder = new DepPageBuilder(false);
    main.pageBuilder.buildPage();
});