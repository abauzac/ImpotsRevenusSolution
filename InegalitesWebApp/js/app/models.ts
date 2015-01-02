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

class LorenzJSON {
    public LorenzDeciles: any;
    public LorenzTranches: any;
}

class DepartementJSON {

    public Gini: any;
    public Lorenz: LorenzJSON;
    public Numero: any;
    public Moyennes: any;
    public Nom: any;

    public Data: any;
}
 