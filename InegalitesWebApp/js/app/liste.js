var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var ListePageBuilder = (function () {
    function ListePageBuilder(htmlLoaded) {
        this.year = null;
        this.pageName = null;
        this.json = null;
        this.htmlLoaded = false;
        this.menu = null;
        this.domPanelTitle = $(".content-wrapper .panel-title-text");
        this.pageTitle = "";
        this.htmlLoaded = htmlLoaded;
        var hash = window.location.hash;
        if (hash && hash.length > 0) {
            var hashParams = hash.substr(1).split("-");

            //param 0 = type de page
            this.pageName = hashParams[0];

            //param 1 = annee
            hashParams.length > 1 ? this.year = hashParams[1] : this.year = "2012";
        } else {
            new ErrorPage("Problème d'url : " + window.location.href).build();
            throw "Erreur d'url";
        }
    }
    /**
    * build page when JSON has been requested
    */
    ListePageBuilder.prototype.buildPage = function () {
        var _this = this;
        // build menu gauche
        if (this.htmlLoaded) {
            // this.menu.changeDepartement(this.depNumber);
        } else {
            this.menu = new ListeMenu(this.year);
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
    ListePageBuilder.prototype.buildContentPage = function () {
        this.domPanelTitle.text(this.pageTitle);
        var contentPage;

        switch (this.pageName) {
            case "liste":
                contentPage = new ListePage(this.json, this.year);
                document.title = "Liste des départements";
                this.pageTitle = "Liste des départements";
                break;
            default:
                contentPage = new ErrorPage("Page not found : " + this.pageName);
                this.pageTitle = "Erreur";
        }

        this.domPanelTitle.text(this.pageTitle);
        contentPage.build();
    };
    return ListePageBuilder;
})();

var ListeMenuItem = (function () {
    function ListeMenuItem() {
        this.subItemList = [];
        this.itemName = "";
        this.hashUrl = null;
    }
    ListeMenuItem.prototype.getFullDom = function () {
        var domItem = $("<a>");

        domItem.addClass("list-group-item");
        var url = "#";
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
    return ListeMenuItem;
})();

var ListeMenu = (function () {
    function ListeMenu(depNumber) {
        this.itemsList = [];
        this.domMenu = $(".menugauche");
        this.depNumber = "";
        this.items = $([]);
        this.depNumber = depNumber;
    }
    ListeMenu.prototype.addMenuItem = function (name, hashUrl, clickcb) {
        var item = new ListeMenuItem();
        item.itemName = name;
        item.clickCallBack = clickcb.bind(this);
        item.hashUrl = hashUrl;
        this.items = this.items.add(item.getFullDom());
        this.itemsList.push(item);
    };

    ListeMenu.prototype.build = function () {
        // create intro
        this.addMenuItem("Liste des départements", ["liste", "2012"], this.itemCallback);

        this.domMenu.empty().append(this.items);
    };

    ListeMenu.prototype.itemCallback = function (event) {
        var linkElem = event.target;
        this.items.removeClass("active");
        linkElem.classList.add("active");
        main.pageBuilder.pageName = linkElem.getAttribute("data-page");
        main.pageBuilder.buildContentPage();
    };
    return ListeMenu;
})();

var ListeModel = (function () {
    function ListeModel() {
    }
    return ListeModel;
})();

var ListePage = (function (_super) {
    __extends(ListePage, _super);
    function ListePage(json, year) {
        _super.call(this, json);
        this.domListe = $("<div>").html($("#listeAnneeTpl").html());
        this.htmlLoaded = false;
        this.year = "2012";
        /**
        * could be "Nom", "Gini" or "Moyenne"
        */
        this.sortColumn = "DepNum";
        /**
        * Could be "asc" or "desc"
        */
        this.sortType = "asc";

        if (year != null) {
            this.year = year;
        }
    }
    ListePage.prototype.build = function () {
        this.clonedTemplate = this.domListe.clone();
        this.contentDiv.on("click", ".liste-table__thead th", this.onClickSorting.bind(this));
        this.buildDropDown();
        this.fillTable();
        this.htmlLoaded = true;
        this.contentDiv.empty().prepend(this.clonedTemplate.html());
    };

    ListePage.prototype.buildDropDown = function () {
        this.clonedTemplate.find("#btn_liste-year").text(this.year + " ").append($("<span class=\"caret\"></span>"));
        var ulDropDown = this.clonedTemplate.find("#ddn_liste-year");
        for (var i = 2003; i != 2013; i++) {
            var dom = document.createElement("a");
            dom.setAttribute("role", "menuitem");
            dom.setAttribute("tabindex", "-1");
            dom.setAttribute("data-year", i.toString());
            dom.setAttribute("href", "#liste-" + i);
            dom.textContent = i.toString();

            var li = document.createElement("li");

            li.appendChild(dom);

            ulDropDown.prepend($(li));
        }
        this.contentDiv.on("click", "#ddn_liste-year a", this.clickDropDown.bind(this));
    };

    ListePage.prototype.clickDropDown = function (event) {
        var _this = this;
        var target = $(event.target);
        this.year = target.attr("data-year");
        $("#btn_liste-year").text(this.year + " ").append($("<span class=\"caret\"></span>"));
        $.ajax({
            url: "datas/annees/" + this.year + ".json",
            success: function (data, status) {
                if (data != null)
                    _this.json = data;
                _this.fillTable();
            }
        });
    };

    ListePage.prototype.onClickSorting = function (event) {
        var dom = $(event.target);
        this.contentDiv.find(".glyphicon." + this.sortType).removeClass(this.sortType);
        this.sortType = dom.attr("data-sort");
        this.sortColumn = dom.attr("data-column");
        dom.addClass(this.sortType);
        this.fillTable();
    };

    ListePage.prototype.fillTable = function () {
        var _this = this;
        this.json = this.json.sort(function (current, next) {
            if (_this.sortType == "asc") {
                return current[_this.sortColumn] - next[_this.sortColumn];
            } else {
                return next[_this.sortColumn] - current[_this.sortColumn];
            }
        });

        var tbody = this.htmlLoaded ? this.contentDiv.find(".liste-table__tbody").empty() : this.clonedTemplate.find(".liste-table__tbody");

        for (var i = 0; i < this.json.length; i++) {
            var model = this.json[i];
            var depnum = model.DepNum;
            if (depnum.lastIndexOf("0") == 2)
                depnum = depnum.substr(0, 2);

            tbody.append("<tr><td>" + (i + 1) + "e</td><td>" + depnum + "</td><td>" + "<a href=\"departement.html#" + model.DepNum + "-intro\">" + model.Nom + "</a></td><td>" + model.Moyenne + "</td><td>" + model.Gini.toFixed(4) + "</tr>");
        }
    };
    return ListePage;
})(ContentPage);

$(document).ready(function () {
    main.pageBuilder = new ListePageBuilder(false);
    main.pageBuilder.buildPage();
});
