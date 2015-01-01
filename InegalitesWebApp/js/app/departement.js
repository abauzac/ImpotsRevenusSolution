/// <reference path="../../Scripts/typings/jquery/jquery.d.ts" />
/// <reference path="index.ts" />
/// <reference path="models.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};

var DepPageBuilder = (function () {
    function DepPageBuilder(htmlLoaded) {
        this.depNumber = null;
        this.pageName = null;
        this.json = null;
        this.htmlLoaded = false;
        this.menu = null;
        this.domDepName = $(".content-wrapper .departement__depName");
        this.htmlLoaded = htmlLoaded;
        var hash = window.location.hash;
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
    DepPageBuilder.prototype.buildPage = function () {
        var _this = this;
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
            success: function (data, status) {
                _this.json = data;
                _this.buildContentPage();
                _this.htmlLoaded = true;
            },
            error: function (xhr, status) {
                new ErrorPage("Impossible de récupérer les données JSON<br />" + "URL : datas/departements/" + _this.depNumber + ".json <br />" + "Status requête : " + xhr.status).build();
            }
        });
    };
    DepPageBuilder.prototype.buildContentPage = function () {
        this.domDepName.text(this.json.Nom);

        var contentPage;

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
            default:
                contentPage = new ErrorPage("Page not found : " + this.pageName);
        }

        contentPage.build();
    };
    return DepPageBuilder;
})();

var MenuItem = (function () {
    function MenuItem() {
        this.subItemList = [];
        this.itemName = "";
        this.depNumber = "";
        this.pagetype = "";
    }
    MenuItem.prototype.getFullDom = function () {
        var domItem = $("<a>");

        domItem.addClass("list-group-item");
        domItem.attr("href", "#" + this.depNumber + "-" + this.pagetype);
        domItem.attr("data-page", this.pagetype);
        domItem.attr("data-dep", this.depNumber);
        domItem.on("click", this.clickCallBack);
        domItem.html(this.itemName);

        return domItem;
    };
    return MenuItem;
})();

var MenuDepartement = (function () {
    function MenuDepartement(depNumber) {
        this.itemsList = [];
        this.domMenu = $(".menugauche");
        this.depNumber = "";
        this.items = $([]);
        this.depNumber = depNumber;
    }
    MenuDepartement.prototype.addMenuItem = function (name, depnumber, pageType, clickcb) {
        var item = new MenuItem();
        item.itemName = name;
        item.depNumber = depnumber;
        item.pagetype = pageType;
        item.clickCallBack = clickcb.bind(this);
        this.items = this.items.add(item.getFullDom());
        this.itemsList.push(item);
    };

    MenuDepartement.prototype.build = function () {
        // create intro
        this.addMenuItem("Données brutes", this.depNumber, "intro", this.itemCallback);

        //create gini
        this.addMenuItem("Gini", this.depNumber, "gini", this.itemCallback);

        //create Lorenz
        this.addMenuItem("Lorenz", this.depNumber, "lorenz", this.itemCallback);

        // create Moyennes
        this.addMenuItem("Moyennes", this.depNumber, "moyennes", this.itemCallback);

        this.domMenu.empty().append(this.items);
    };

    MenuDepartement.prototype.changeDepartement = function (depNumber) {
        for (var i = 0; i < this.items.length; i++) {
            var item = $(this.items[i]);
            item.attr("href", "#" + depNumber + "-" + item.attr("data-page"));
            item.attr("data-dep", depNumber);
        }
    };

    MenuDepartement.prototype.itemCallback = function (event) {
        var linkElem = event.target;
        this.items.removeClass("active");
        linkElem.classList.add("active");
        main.pageBuilder.pageName = linkElem.getAttribute("data-page");
        main.pageBuilder.buildContentPage();
    };
    return MenuDepartement;
})();

var IntroPage = (function (_super) {
    __extends(IntroPage, _super);
    function IntroPage(json) {
        _super.call(this, json);
        this.introTpl = $("<div>").html($("#depIntroTemplate").html());
        this.tableDepYearTpl = $("<div>").html($("#depIntroTableTemplate").html());
    }
    IntroPage.prototype.build = function () {
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
    };

    IntroPage.prototype.getValueFormatted = function (value, isDevise) {
        if (typeof isDevise === "undefined") { isDevise = true; }
        if (!value)
            return "";

        if (value == -1) {
            return "n.d.";
        } else {
            if (isDevise) {
                return numeral(value).format('0,0$');
            } else {
                return value.toString();
            }
        }
    };

    IntroPage.prototype.createTable = function (depYear, clonedTableTpl) {
        for (var tNum = 0; tNum < depYear.tranches.length; tNum++) {
            var t = depYear.tranches[tNum];
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
    };
    return IntroPage;
})(ContentPage);

var GiniPage = (function (_super) {
    __extends(GiniPage, _super);
    function GiniPage(json) {
        _super.call(this, json);
        this.giniTpl = $("<div>").html($("#depGiniTemplate").html());
    }
    GiniPage.prototype.build = function () {
        if (this.json) {
            var json = this.json;
            var clonedIntroTpl = this.giniTpl.clone();

            this.contentDiv.empty().prepend(clonedIntroTpl.html());

            this.createChart(this.json.Gini);
        } else {
            this.showErrorPage("Impossible de récupérer les données JSON");
        }
    };

    GiniPage.prototype.createChart = function (gini) {
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
                }
            }
        };

        // In the global name space Chartist we call the Line function to initialize a line chart.
        //As a first parameter we pass in a selector where we would like to get our chart created.
        //Second parameter is the actual data object and as a
        //third parameter we pass in our options
        new Chartist.Line('.ct-chart', data, options);
    };
    return GiniPage;
})(ContentPage);

var MoyennesPage = (function (_super) {
    __extends(MoyennesPage, _super);
    function MoyennesPage(json) {
        _super.call(this, json);
        this.moyTpl = $("<div>").html($("#depMoyennesTemplate").html());
    }
    MoyennesPage.prototype.build = function () {
        if (this.json) {
            var json = this.json;
            var clonedIntroTpl = this.moyTpl.clone();

            this.contentDiv.empty().prepend(clonedIntroTpl.html());

            this.createChart(this.json.Moyennes);
        }
    };

    MoyennesPage.prototype.createChart = function (moy) {
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
            //  width: '480px',
            height: '320px'
        };

        // In the global name space Chartist we call the Line function to initialize a line chart.
        //As a first parameter we pass in a selector where we would like to get our chart created.
        //Second parameter is the actual data object and as a
        //third parameter we pass in our options
        new Chartist.Line('.ct-chart-moy', data, options);
    };
    return MoyennesPage;
})(ContentPage);

var LorenzPage = (function (_super) {
    __extends(LorenzPage, _super);
    function LorenzPage(json) {
        _super.call(this, json);
        this.lorenzTpl = $("<div>").html($("#depLorenzTemplate").html());
        this.chartClass = '.ct-chart-lorenz';
    }
    LorenzPage.prototype.build = function () {
        if (this.json) {
            var json = this.json;
            this.clonedTpl = this.lorenzTpl.clone();

            this.createChart(this.json.Lorenz);

            this.insertChart();
        }
    };

    LorenzPage.prototype.createChart = function (lorenz) {
        var labels = [];
        var series = [[]];
        series.push([]);
        if (!this.year) {
            this.year = "2012";
        }

        var lorenzCurve = lorenz[this.year];

        for (var i = 0; i < lorenzCurve.length; i++) {
            var x = (Math.round(lorenzCurve[i].Key * 100)).toFixed(1);
            var y = (Math.round(lorenzCurve[i].Value * 100)).toFixed(1);

            labels.push(x);
            series[0].push(y);

            // seconde courbe : égalité parfaite
            series[1].push(1 / lorenzCurve.length * i * 100);
        }
        series[1].push(100.0);

        var valeurMiddle = Math.round(lorenzCurve.length / 2);
        var lecturePop = (Math.round(lorenzCurve[valeurMiddle].Key * 100)).toFixed(1);
        var lectureRev = (Math.round(lorenzCurve[valeurMiddle].Value * 100)).toFixed(1);

        this.clonedTpl.find(".lecturePop").text(lecturePop);
        this.clonedTpl.find(".lectureRev").text(lecturePop);

        // Create a simple line chart
        this.dataChart = {
            // A labels array that can contain any sort of values
            labels: labels,
            // Our series array that contains series objects or in this case series data arrays
            series: series
        };

        this.optionsChart = {
            width: '320px',
            height: '320px'
        };
    };

    LorenzPage.prototype.insertChart = function () {
        this.contentDiv.empty().prepend(this.clonedTpl.html());

        // In the global name space Chartist we call the Line function to initialize a line chart.
        //As a first parameter we pass in a selector where we would like to get our chart created.
        //Second parameter is the actual data object and as a
        //third parameter we pass in our options
        new Chartist.Line('.ct-chart-lorenz', this.dataChart, this.optionsChart);
    };
    return LorenzPage;
})(ContentPage);

$(document).ready(function () {
    main.pageBuilder = new DepPageBuilder(false);
    main.pageBuilder.buildPage();
});
