

class ListePageBuilder implements IPageBuilder {
    public year: string = null;
    public pageName: string = null;
    public json: ListeModel[] = null;
    public htmlLoaded: boolean = false;
    public menu: ListeMenu = null;
    public domPanelTitle = $(".content-wrapper .panel-title-text");
    public pageTitle: string = "";

    constructor(htmlLoaded: boolean) {
        this.htmlLoaded = htmlLoaded;
        var hash: string = window.location.hash;
        if (hash && hash.length > 0) {
            var hashParams = hash.split("-");

            //param 0 = type de page
            this.pageName = hashParams[0].substr(1, hashParams[0].length);
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
    public buildPage() {

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
            success: (data: any, status) => {
                this.json = data;
                this.buildContentPage();
                this.htmlLoaded = true;
            },
            error: (xhr: JQueryXHR, status: string) => {
                new ErrorPage("Impossible de récupérer les données JSON<br />" +
                    "URL : datas/annees/" + this.year + ".json <br />" +
                    "Status requête : " + xhr.status).build();
            }
        });



    }
    public buildContentPage() {

        this.domPanelTitle.text(this.pageTitle);
        var contentPage: ContentPage;

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
    }


}

class ListeMenuItem {
    public subItemList: ListeMenuItem[] = [];
    public itemName: string = "";
    public hashUrl: string[] = null;
    public clickCallBack: (event: JQueryEventObject) => void;
    constructor() {

    }

    public getFullDom(): JQuery {
        var domItem = $("<a>");

        domItem.addClass("list-group-item");
        var url = "#";
        for (var i = 0; i < this.hashUrl.length; i++) {
            if (i != 0) url += "-";
            url += this.hashUrl[i];
        }
        domItem.attr("data-menu", this.hashUrl.toString());
        domItem.attr("href", url);
        domItem.on("click", this.clickCallBack);
        domItem.html(this.itemName);

        return domItem;
    }
}

class ListeMenu {
    public itemsList: ListeMenuItem[] = [];
    public domMenu: JQuery = $(".menugauche");
    public depNumber: string = "";
    public items: JQuery = $([]);

    constructor(depNumber: string) {
        this.depNumber = depNumber;
    }

    public addMenuItem(name: string, hashUrl:string[], clickcb?: (event: JQueryEventObject) => void) {
        var item = new ListeMenuItem();
        item.itemName = name;
        item.clickCallBack = clickcb.bind(this);
        item.hashUrl = hashUrl;
        this.items = this.items.add(item.getFullDom());
        this.itemsList.push(item);
    }

    public build() {

        // create intro
        this.addMenuItem("Liste des départements", ["liste", "2012"], this.itemCallback);

        this.domMenu.empty().append(this.items);
    }


    public itemCallback(event: JQueryEventObject) {
        var linkElem = event.target;
        this.items.removeClass("active");
        (<HTMLElement>linkElem).classList.add("active");
        main.pageBuilder.pageName = (<HTMLElement>linkElem).getAttribute("data-page");
        main.pageBuilder.buildContentPage();
    }

}

class ListeModel {
    public Gini: number;
    public Nom: string;
    public DepNum: string;
    public Moyenne: number;
}

class ListePage extends ContentPage {

    public domListe = $("<div>").html($("#listeAnneeTpl").html());
    public clonedTemplate: JQuery;
    public htmlLoaded: boolean = false;
    public year: string = "2012";
    /**
     * could be "Nom", "Gini" or "Moyenne"
     */
    public sortColumn = "DepNum";

    /**
     * Could be "asc" or "desc"
     */
    public sortType = "asc";


    constructor(json: ListeModel[], year?:string) {
        super(json);

        if (year != null) {
            this.year = year;
        }
    }

    public build() {
        this.clonedTemplate = this.domListe.clone();
        this.contentDiv.on("click", ".liste-table__thead th", this.onClickSorting.bind(this));
        this.buildDropDown();
        this.fillTable();
        this.htmlLoaded = true;
        this.contentDiv.empty().prepend(this.clonedTemplate.html());
    }

    private buildDropDown() {
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
    }

    public clickDropDown(event: JQueryEventObject) {
        var target = $(event.target);
        this.year = target.attr("data-year");
        $("#btn_liste-year").text(this.year + " ").append($("<span class=\"caret\"></span>"));
        $.ajax({
            url: "datas/annees/" + this.year + ".json",
            success:  (data: ListeModel[], status) => {
                if (data != null) this.json = data;
                this.fillTable();
            }
        });
    }

    private onClickSorting(event: JQueryEventObject) {
        var dom = $(event.target);
        this.contentDiv.find(".glyphicon." + this.sortType).removeClass(this.sortType);
        this.sortType = dom.attr("data-sort");
        this.sortColumn = dom.attr("data-column");
        dom.addClass(this.sortType);
        this.fillTable();
    }

    private fillTable() {
        this.json = this.json.sort(
            (current, next) => {
                if (this.sortType == "asc") {
                    return current[this.sortColumn] - next[this.sortColumn];
                } else {
                    return next[this.sortColumn] - current[this.sortColumn];
                }
            });

        var tbody = this.htmlLoaded ? this.contentDiv.find(".liste-table__tbody").empty() : this.clonedTemplate.find(".liste-table__tbody");

        for (var i = 0; i < this.json.length; i++) {
            var model: ListeModel = this.json[i];
            var depnum = model.DepNum;
            if (depnum.lastIndexOf("0") == 2) depnum = depnum.substr(0, 2);

            tbody.append("<tr><td>" +
                (i+1) + "e</td><td>" +
                depnum + "</td><td>" +
                model.Nom + "</td><td>" +
                model.Moyenne + "</td><td>" +
                model.Gini.toFixed(4) + "</tr>");
        }
    }
}

$(document).ready(function () {
    main.pageBuilder = new ListePageBuilder(false);
    main.pageBuilder.buildPage();
});