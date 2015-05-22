var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var CartesPageBuilder = (function () {
    function CartesPageBuilder(htmlLoaded) {
        this.year = "2012";
        this.pageName = "average";
        this.json = null;
        this.htmlLoaded = false;
        this.menu = null;
        this.domPanelTitle = $(".content-wrapper .panel-title-text");
        this.pageTitle = "";
        this.htmlLoaded = htmlLoaded;
        var hash = window.location.hash;
        if (hash && hash.length > 0) {
            var hashParams = hash.substring(1).split("&");

            for (var i = 0; i < hashParams.length; i++) {
                var paramValue = hashParams[i].split("=");

                if (paramValue.length > 0) {
                    var param = paramValue[0];
                    var value = paramValue.length == 2 ? paramValue[1] : null;

                    // get parameters
                    if (param == "year") {
                        this.year = value ? value : "2012";
                    } else if (param == "datas") {
                        this.pageName = value ? value : "average";
                    } else {
                        console.log("unknown parameter=" + param + " value=" + value);
                    }
                }
            }
        }
    }
    /**
    * build page when JSON has been requested
    */
    CartesPageBuilder.prototype.buildPage = function () {
        var _this = this;
        // build menu gauche
        if (this.htmlLoaded) {
            // this.menu.changeDepartement(this.depNumber);
        } else {
            this.menu = new ListeMenuCarte(this.year);
            this.menu.build();
        }

        // build content
        var url = "datas/annees/" + this.year + ".json";

        // if html not loaded : create menu
        $.ajax({
            url: url,
            success: function (data, status) {
                _this.json = data;
                _this.buildContentPage();
                _this.htmlLoaded = true;
            },
            error: function (xhr, status) {
                new ErrorPage("Impossible de récupérer les données JSON<br />" + "URL : datas/annees/" + _this.year + ".json <br />" + "Status requête : " + xhr.status).build();
            }
        });
    };

    CartesPageBuilder.prototype.setPageName = function (pagename) {
        document.title = pagename;
        this.domPanelTitle.text(pagename);
    };

    CartesPageBuilder.prototype.buildContentPage = function () {
        var contentPage;

        switch (this.pageName) {
            case "average":
                contentPage = new CarteFrancePage(this.json, this.year, this.pageName);
                this.setPageName("Carte de France : Moyennes des revenus déclarés (" + this.year + ")");
                break;
            default:
                contentPage = new ErrorPage("Page not found : " + this.pageName);
                this.setPageName("Page non trouvée");
        }
        contentPage.build();
    };
    return CartesPageBuilder;
})();

var ListeMenuCarteItem = (function () {
    function ListeMenuCarteItem() {
        this.subItemList = [];
        this.itemName = "";
        this.hashUrl = null;
    }
    ListeMenuCarteItem.prototype.getFullDom = function () {
        var domItem = $("<a>");

        domItem.addClass("list-group-item");
        var url = this.htmlpage + ".html#";
        for (var i = 0; i < this.hashUrl.length; i++) {
            if (i != 0)
                url += "-";
            url += this.hashUrl[i];
        }
        domItem.attr("data-menu", this.hashUrl.toString());
        domItem.attr("href", url);
        domItem.on("click", this.clickCallBack);
        domItem.html(this.itemName);

        return domItem;
    };
    return ListeMenuCarteItem;
})();

var ListeMenuCarte = (function () {
    function ListeMenuCarte(depNumber) {
        this.itemsList = [];
        this.domMenu = $(".menugauche");
        this.depNumber = "";
        this.items = $([]);
        this.depNumber = depNumber;
    }
    ListeMenuCarte.prototype.addMenuItem = function (name, htmlpage, hashUrl, clickcb) {
        var item = new ListeMenuCarteItem();
        item.itemName = name;
        item.htmlpage = htmlpage;
        item.clickCallBack = clickcb.bind(this);
        item.hashUrl = hashUrl;
        this.items = this.items.add(item.getFullDom());
        this.itemsList.push(item);
    };

    ListeMenuCarte.prototype.build = function () {
        // create intro
        this.addMenuItem("Liste des départements", "liste", ["liste", "2012"], this.itemCallback);

        this.addMenuItem("Carte de la France", "cartes", ["average", "2012"], this.itemCallback);

        this.domMenu.empty().append(this.items);
    };

    ListeMenuCarte.prototype.itemCallback = function (event) {
        var linkElem = event.target;
        this.items.removeClass("active");
        linkElem.classList.add("active");
        main.pageBuilder.pageName = linkElem.getAttribute("data-page");
        main.pageBuilder.buildContentPage();
    };
    return ListeMenuCarte;
})();

var CarteFrancePage = (function (_super) {
    __extends(CarteFrancePage, _super);
    function CarteFrancePage(json, year, datatype) {
        _super.call(this, json);
        this.domFranceTemplate = $("<div>").html($("#mapFranceTemplate").html());
        this.htmlLoaded = false;
        this.listDepartementColor = [];
        this.arrayLegendString = [];
        /**
        * White to blue color array (8 items)
        */
        this.colorArray = ['rgb(255,247,251)', 'rgb(236,231,242)', 'rgb(208,209,230)', 'rgb(166,189,219)', 'rgb(116,169,207)', 'rgb(54,144,192)', 'rgb(5,112,176)', 'rgb(3,78,123)'];

        this.year = year;
        this.dataType = datatype;
    }
    CarteFrancePage.prototype.build = function () {
        this.clonedTemplate = this.domFranceTemplate.clone();
        this.contentDiv.empty().prepend(this.clonedTemplate.html());

        this.htmlLoaded = true;

        this.setDomObjects();

        this.setupInputYear();

        this.fillMap();
    };

    CarteFrancePage.prototype.fillMap = function () {
        // convert json to departmentColor
        this.convertToDataColor();

        // sort array
        this.sortArray();

        // fill color
        this.fillColor();

        // build legend
        this.buildLegend();

        // tooltips only work on non-virtual dom
        this.addTooltips();
    };

    CarteFrancePage.prototype.setDomObjects = function () {
        this.domSvg = this.contentDiv.find("svg");
        this.domLegend = this.contentDiv.find(".legend__wrapper");
        this.domInputYear = $("#inputyear");
        this.domSelectedYear = $(".range__selected-year");
    };

    CarteFrancePage.prototype.setupInputYear = function () {
        this.domInputYear.off("change", this.onUpdateInput.bind(this));
        this.domInputYear.on("change", this.onUpdateInput.bind(this));
        this.domInputYear.val(this.year);
        this.domSelectedYear.text(this.year);
    };

    CarteFrancePage.prototype.onUpdateInput = function (event) {
        var _this = this;
        var selectedYear = event.currentTarget.value;

        this.domSelectedYear.text(selectedYear);

        var url = "datas/annees/" + selectedYear + ".json";

        // if html not loaded : create menu
        $.ajax({
            url: url,
            success: function (data, status) {
                _this.json = data;
                _this.year = selectedYear;
                _this.domInputYear.val(_this.year);
                main.pageBuilder.setPageName("Carte de France : Les moyennes des revenus déclarés (" + _this.year + ")");
                _this.fillMap();
            },
            error: function (xhr, status) {
                new ErrorPage("Impossible de récupérer les données JSON<br />" + "URL : datas/annees/" + _this.year + ".json <br />" + "Status requête : " + xhr.status).build();
            }
        });
    };

    CarteFrancePage.prototype.addTooltips = function () {
        for (var i = 0; i < this.listDepartementColor.length; i++) {
            var depColor = this.listDepartementColor[i];
            $(depColor.className).qtip("destroy");
            $(depColor.className).qtip({
                content: {
                    title: depColor.depNum + " - " + depColor.name,
                    text: this.formatTooltipText(depColor.value)
                },
                position: {
                    my: "bottom center",
                    at: "top center",
                    target: depColor.className
                }
            });
        }
    };

    CarteFrancePage.prototype.formatTooltipText = function (value) {
        switch (this.dataType) {
            case "average":
                return "Revenu moyen de " + value + "€ par habitant";
        }

        return "";
    };

    CarteFrancePage.prototype.buildLegend = function () {
        var legend = new MapLegend(this.domLegend, this.colorArray, this.arrayLegendString);
        legend.build();
    };

    CarteFrancePage.prototype.fillColor = function () {
        // reset legend array
        this.arrayLegendString = [];

        for (var departmentPosition = 0; departmentPosition < this.listDepartementColor.length; departmentPosition++) {
            if (departmentPosition < 15) {
                this.listDepartementColor[departmentPosition].domSvgPath.css("fill", this.colorArray[0]);
            } else if (departmentPosition < 30) {
                this.listDepartementColor[departmentPosition].domSvgPath.css("fill", this.colorArray[1]);
                if (departmentPosition == 15)
                    this.arrayLegendString.push(" < " + this.listDepartementColor[departmentPosition].value + "€");
            } else if (departmentPosition < 45) {
                this.listDepartementColor[departmentPosition].domSvgPath.css("fill", this.colorArray[2]);
                if (departmentPosition == 30)
                    this.arrayLegendString.push(" < " + this.listDepartementColor[departmentPosition].value + "€");
            } else if (departmentPosition < 60) {
                this.listDepartementColor[departmentPosition].domSvgPath.css("fill", this.colorArray[3]);
                if (departmentPosition == 45)
                    this.arrayLegendString.push(" < " + this.listDepartementColor[departmentPosition].value + "€");
            } else if (departmentPosition < 75) {
                this.listDepartementColor[departmentPosition].domSvgPath.css("fill", this.colorArray[4]);
                if (departmentPosition == 60)
                    this.arrayLegendString.push(" < " + this.listDepartementColor[departmentPosition].value + "€");
            } else if (departmentPosition < 90) {
                this.listDepartementColor[departmentPosition].domSvgPath.css("fill", this.colorArray[5]);
                if (departmentPosition == 75)
                    this.arrayLegendString.push(" < " + this.listDepartementColor[departmentPosition].value + "€");
            } else if (departmentPosition < 95) {
                this.listDepartementColor[departmentPosition].domSvgPath.css("fill", this.colorArray[6]);
                if (departmentPosition == 90)
                    this.arrayLegendString.push(" < " + this.listDepartementColor[departmentPosition].value + "€");
            } else {
                this.listDepartementColor[departmentPosition].domSvgPath.css("fill", this.colorArray[7]);
                if (departmentPosition == 95) {
                    this.arrayLegendString.push(" < " + this.listDepartementColor[departmentPosition].value + "€");
                    this.arrayLegendString.push(" >= " + this.listDepartementColor[departmentPosition].value + "€");
                }
            }
        }
    };
    CarteFrancePage.prototype.convertToDataColor = function () {
        this.listDepartementColor = [];
        for (var i = 0; i < this.json.length; i++) {
            var jsonobj = this.json[i];
            var depColor = new DepartementColor();
            depColor.depNum = jsonobj.DepNum.lastIndexOf("0") == 2 ? jsonobj.DepNum.substr(0, 2) : jsonobj.DepNum;
            depColor.name = jsonobj.Nom;
            depColor.className = ".departement" + depColor.depNum.toLowerCase();
            depColor.domSvgPath = this.domSvg.find(depColor.className);

            if (this.dataType == "average") {
                depColor.value = jsonobj.Moyenne;
            }

            this.listDepartementColor.push(depColor);
        }
    };

    /*
    * Sort the listDepartementColor using values
    */
    CarteFrancePage.prototype.sortArray = function () {
        this.listDepartementColor = this.listDepartementColor.sort(function (current, next) {
            return current.value - next.value;
        });
    };
    return CarteFrancePage;
})(ContentPage);

var MapLegend = (function () {
    function MapLegend(dom, colorArray, legendArray) {
        if (!colorArray || !legendArray || colorArray.length != legendArray.length)
            throw "Error in legend arrays " + colorArray + " , " + legendArray;

        this.domLegend = dom;
        this.colorArray = colorArray;
        this.legendArray = legendArray;
    }
    MapLegend.prototype.build = function () {
        if (!this.colorArray || !this.legendArray)
            return;

        var table = $(document.createElement("table"));

        for (var row = 0; row < this.colorArray.length; row++) {
            var domrow = $(document.createElement("tr"));
            var tdsquare = $(document.createElement("td"));
            tdsquare.addClass("legend__square");
            tdsquare.css("background-color", this.colorArray[row]);
            var tdcontent = $(document.createElement("td"));
            tdcontent.text(this.legendArray[row]);
            domrow.append(tdsquare).append(tdcontent);
            table.append(domrow);
        }

        this.domLegend.empty().append(table);
    };
    return MapLegend;
})();

var DepartementColor = (function () {
    function DepartementColor() {
    }
    return DepartementColor;
})();

$(document).ready(function () {
    main.pageBuilder = new CartesPageBuilder(false);
    main.pageBuilder.buildPage();
});
