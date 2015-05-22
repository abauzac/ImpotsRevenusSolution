
class CartesPageBuilder implements IPageBuilder {
    public year: string = "2012";
    public pageName: string = "average";
    public json: ListeModel[] = null;
    public htmlLoaded: boolean = false;
    public menu: ListeMenuCarte = null;
    public domPanelTitle = $(".content-wrapper .panel-title-text");
    public pageTitle: string = "";

    constructor(htmlLoaded: boolean) {
        this.htmlLoaded = htmlLoaded;
        var hash: string = window.location.hash;
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
    public buildPage() {


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

    public setPageName(pagename: string) :void {
        document.title = pagename;
        this.domPanelTitle.text(pagename);
    }

    public buildContentPage() {

        var contentPage: ContentPage;

        switch (this.pageName) {
            case "average":
                contentPage = new CarteFrancePage(this.json, this.year, this.pageName);
                this.setPageName("Carte de France : Moyennes des revenus déclarés (" + this.year + ")");
                break;
            default:
                contentPage = new ErrorPage("Page not found : " + this.pageName);
                this.setPageName( "Page non trouvée");
        }
        contentPage.build();
    }


}



class ListeMenuCarteItem {
    public subItemList: ListeMenuCarteItem[] = [];
    public itemName: string = "";
    public hashUrl: string[] = null;
    public htmlpage: string;
    public clickCallBack: (event: JQueryEventObject) => void;
    constructor() {

    }

    public getFullDom(): JQuery {
        var domItem = $("<a>");

        domItem.addClass("list-group-item");
        var url = this.htmlpage + ".html#";
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

class ListeMenuCarte {
    public itemsList: ListeMenuCarteItem[] = [];
    public domMenu: JQuery = $(".menugauche");
    public depNumber: string = "";
    public items: JQuery = $([]);

    constructor(depNumber: string) {
        this.depNumber = depNumber;
    }

    public addMenuItem(name: string, htmlpage: string, hashUrl: string[], clickcb?: (event: JQueryEventObject) => void) {
        var item = new ListeMenuCarteItem();
        item.itemName = name;
        item.htmlpage = htmlpage;
        item.clickCallBack = clickcb.bind(this);
        item.hashUrl = hashUrl;
        this.items = this.items.add(item.getFullDom());
        this.itemsList.push(item);
    }

    public build() {

        // create intro
        this.addMenuItem("Liste des départements", "liste", ["liste", "2012"], this.itemCallback);

        this.addMenuItem("Carte de la France", "cartes", ["average", "2012"], this.itemCallback);

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



class CarteFrancePage extends ContentPage {

    public domFranceTemplate = $("<div>").html($("#mapFranceTemplate").html());
    public clonedTemplate: JQuery;
    public domSvg: JQuery;
    public domLegend: JQuery;
    public domInputYear: JQuery;
    public domSelectedYear: JQuery;
    public htmlLoaded: boolean = false;
    public year: string;
    public dataType: string;
    public listDepartementColor: DepartementColor[] = [];
    public arrayLegendString: string[] = [];
    /**
     * White to blue color array (8 items)
     */
    public colorArray: string[] = ['rgb(255,247,251)', 'rgb(236,231,242)', 'rgb(208,209,230)', 'rgb(166,189,219)', 'rgb(116,169,207)', 'rgb(54,144,192)', 'rgb(5,112,176)', 'rgb(3,78,123)'];

    constructor(json, year: string, datatype: string) {
        super(json);

        this.year = year;
        this.dataType = datatype;

    }

    public build(): void {

        this.clonedTemplate = this.domFranceTemplate.clone();
        this.contentDiv.empty().prepend(this.clonedTemplate.html());

        this.htmlLoaded = true;

        this.setDomObjects();

        this.setupInputYear();

        this.fillMap();



        
    }

    private fillMap() {
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
    }

    private setDomObjects() {
        
        this.domSvg = this.contentDiv.find("svg");
        this.domLegend = this.contentDiv.find(".legend__wrapper");
        this.domInputYear = $("#inputyear");
        this.domSelectedYear = $(".range__selected-year");
    }

    private setupInputYear() {
        this.domInputYear.off("change", this.onUpdateInput.bind(this));
        this.domInputYear.on("change", this.onUpdateInput.bind(this));
        this.domInputYear.val(this.year);
        this.domSelectedYear.text(this.year);
    }

    private onUpdateInput(event: Event) {
        var selectedYear = (<any>event.currentTarget).value;

        this.domSelectedYear.text(selectedYear);

        var url = "datas/annees/" + selectedYear + ".json";
        // if html not loaded : create menu

        $.ajax({
            url: url,
            success: (data: any, status) => {
                this.json = data;
                this.year = selectedYear;
                this.domInputYear.val(this.year);
                main.pageBuilder.setPageName("Carte de France : Les moyennes des revenus déclarés (" + this.year + ")");
                this.fillMap();
            },
            error: (xhr: JQueryXHR, status: string) => {
                new ErrorPage("Impossible de récupérer les données JSON<br />" +
                    "URL : datas/annees/" + this.year + ".json <br />" +
                    "Status requête : " + xhr.status).build();
            }
        });
    }

    private addTooltips() {
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
    }

    private formatTooltipText(value: string): string {
        switch (this.dataType) {
            case "average":
                return "Revenu moyen de " + value + "€ par habitant";
        }

        return "";
    }


    private buildLegend() {
        var legend = new MapLegend(this.domLegend, this.colorArray, this.arrayLegendString);
        legend.build();
    }

    private fillColor() {

        // reset legend array
        this.arrayLegendString = [];

        // sorted departements
        // 8 colors available
        // color mapped as 15/30/45/60/75/90/95/95+


        for (var departmentPosition = 0;
            departmentPosition < this.listDepartementColor.length;
            departmentPosition++) {

            if (departmentPosition < 15)
            {
                this.listDepartementColor[departmentPosition].domSvgPath.css("fill", this.colorArray[0]);
            }
            else if (departmentPosition < 30)
            {
                this.listDepartementColor[departmentPosition].domSvgPath.css("fill", this.colorArray[1]);
                if (departmentPosition == 15) this.arrayLegendString.push(" < " + this.listDepartementColor[departmentPosition].value + "€");
            }
            else if (departmentPosition < 45)
            {
                this.listDepartementColor[departmentPosition].domSvgPath.css("fill", this.colorArray[2]);
                if (departmentPosition == 30) this.arrayLegendString.push(" < " + this.listDepartementColor[departmentPosition].value + "€");
            }
            else if (departmentPosition < 60)
            {
                this.listDepartementColor[departmentPosition].domSvgPath.css("fill", this.colorArray[3]);
                if (departmentPosition == 45) this.arrayLegendString.push(" < " + this.listDepartementColor[departmentPosition].value + "€");
            }
            else if (departmentPosition < 75)
            {
                this.listDepartementColor[departmentPosition].domSvgPath.css("fill", this.colorArray[4]);
                if (departmentPosition == 60) this.arrayLegendString.push(" < " + this.listDepartementColor[departmentPosition].value + "€");
            }
            else if (departmentPosition < 90)
            {
                this.listDepartementColor[departmentPosition].domSvgPath.css("fill", this.colorArray[5]);
                if (departmentPosition == 75) this.arrayLegendString.push(" < " + this.listDepartementColor[departmentPosition].value + "€");
            }
            else if (departmentPosition < 95)
            {
                this.listDepartementColor[departmentPosition].domSvgPath.css("fill", this.colorArray[6]);
                if (departmentPosition == 90) this.arrayLegendString.push(" < " + this.listDepartementColor[departmentPosition].value + "€");
            }
            else
            {
                this.listDepartementColor[departmentPosition].domSvgPath.css("fill", this.colorArray[7]);
                if (departmentPosition == 95) {
                    this.arrayLegendString.push(" < " + this.listDepartementColor[departmentPosition].value + "€");
                    this.arrayLegendString.push(" >= " + this.listDepartementColor[departmentPosition].value + "€");
                }
            }
        }
    }
    private convertToDataColor() {
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
    }

    /*
     * Sort the listDepartementColor using values
     */
    private sortArray() {
        this.listDepartementColor = this.listDepartementColor.sort((current, next) => {
            return current.value - next.value;
        });
    }

}

class MapLegend {

    public domLegend: JQuery;
    public colorArray: string[];
    public legendArray: string[];

    constructor(dom: JQuery, colorArray: string[], legendArray: string[]) {
        if (!colorArray || !legendArray || colorArray.length != legendArray.length)
            throw "Error in legend arrays " + colorArray + " , " + legendArray;

        this.domLegend = dom;
        this.colorArray = colorArray;
        this.legendArray = legendArray;

    }

    public build() {

        if (!this.colorArray || !this.legendArray) return;

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
    }
}


class DepartementColor {
    public name: string;
    public depNum: string;
    public className: string;
    public domSvgPath: JQuery;
    public value: any;
    public color: string;
    public onClick: any;
}


$(document).ready(function () {
    main.pageBuilder = new CartesPageBuilder(false);
    main.pageBuilder.buildPage();
});