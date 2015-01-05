using ComputeDataImpotsRevenus.Model;
using ImpotRevenuParser.model;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;

namespace ComputeDataImpotsRevenus
{
    class DepartementProcessor
    {
        Departement currentDepartement;
        List<Departement> everyYearsForCurrentDepartement = new List<Departement>();

        public DepartementProcessor(Departement dep, List<Departement[]> listEachYearAllDepartments)
        {
            this.currentDepartement = dep;


            foreach (Departement[] oneYearAllDepartments in listEachYearAllDepartments)
            {
                Departement depyear = oneYearAllDepartments.Where(deppartement => deppartement.depName == this.currentDepartement.depName ||
                                                                                  deppartement.depNumber == this.currentDepartement.depNumber).First();
                if (depyear != null)
                {
                    everyYearsForCurrentDepartement.Add(depyear);
                }
            }

            if (listEachYearAllDepartments.Count() != everyYearsForCurrentDepartement.Count())
            {
                Console.WriteLine("Oups, nombre d'années n'équivaut pas au total de fichiers pour le département : " + this.currentDepartement.depNumber);
            }


        }


        public Dictionary<string, decimal> calculerMoyenne()
        {
            Dictionary<string, decimal> averageForEachYear = new Dictionary<string, decimal>();
            foreach (Departement dep in everyYearsForCurrentDepartement)
            {
                if (dep.nbFoyers > 0)
                {
                    decimal average = Math.Round(Convert.ToDecimal(dep.revenus / dep.nbFoyers), 3, MidpointRounding.ToEven);
                    averageForEachYear.Add(dep.year.ToString(), average);
                }
            }
            return averageForEachYear;
        }

        public LorenzData cumulLorenz()
        {
            LorenzData ldata = new LorenzData();

            // calcul par tranche
            Dictionary<string, List<KeyValuePair<decimal, decimal>>> lorenzCurvesEachYear = new Dictionary<string, List<KeyValuePair<decimal, decimal>>>();

            foreach (Departement dep in everyYearsForCurrentDepartement)
            {

                List<KeyValuePair<decimal, decimal>> lorenzCurve = new List<KeyValuePair<decimal, decimal>>();
                lorenzCurve.Add(new KeyValuePair<decimal, decimal>(new decimal(0), new decimal(0)));
                decimal previousPopulationProp = new Decimal(0);
                decimal previousRevenuProp = new Decimal(0);


                for (int i = 0; i < dep.tranches.Length; i++)
                {
                    Tranche tranche = dep.tranches[i];
                    if (tranche.revenus != new decimal(-1))
                    {
                        previousRevenuProp = Math.Round((decimal)tranche.revenus / (decimal)dep.revenus + previousRevenuProp, 5, MidpointRounding.ToEven);
                        previousPopulationProp = Math.Round((decimal)tranche.nbFoyers / (decimal)dep.nbFoyers + previousPopulationProp, 5, MidpointRounding.ToEven);

                        // correction arronds 
                        if (Math.Abs(1 - previousPopulationProp) <= new decimal(0.001)) previousPopulationProp = new decimal(1.00001);
                        if (Math.Abs(1 - previousRevenuProp) <= new decimal(0.001)) previousRevenuProp = new decimal(1.00001);

                        lorenzCurve.Add(new KeyValuePair<decimal, decimal>(previousPopulationProp, previousRevenuProp));
                    }
                    else
                    {
                        if (i == dep.tranches.Length - 1) // last item : add 1,1
                        {
                            lorenzCurve.Add(new KeyValuePair<decimal, decimal>(new decimal(1), new decimal(1)));
                        }
                    }
                }

                lorenzCurvesEachYear.Add(dep.year.ToString(), lorenzCurve);

            }

            ldata.LorenzTranches = lorenzCurvesEachYear;
            // calcul par interpolation linéaire : 10 deciles

            Dictionary<string, List<KeyValuePair<decimal, decimal>>> lorenzDecilesEachYear = new Dictionary<string, List<KeyValuePair<decimal, decimal>>>();

            foreach (string year in lorenzCurvesEachYear.Keys)
            {
                List<KeyValuePair<decimal, decimal>> lorCurve = lorenzCurvesEachYear[year];

                List<KeyValuePair<decimal, decimal>> lorenzDeciles = new List<KeyValuePair<decimal, decimal>>();
                lorenzDeciles.Add(new KeyValuePair<decimal, decimal>(new decimal(0), new decimal(0)));

                decimal x = new decimal(.05);
                // loop sur les coordonnées d'une année
                // x sera la valeur incrémentée pour l'interpolation, on commence a 5% car 

                // y = ax + b
                // a = (y2 - y1) / (x2 - x1)
                // b = y1 - a*x1 = y2 - a*x2
                KeyValuePair<decimal, decimal> previousCoord = new KeyValuePair<decimal, decimal>();
                foreach (KeyValuePair<decimal, decimal> currentCoord in lorCurve)
                {
                    decimal lorenzX = currentCoord.Key * 100;
                    decimal a = new decimal(0);
                    decimal b = new decimal(0);

                    if (currentCoord.Key != 0) // previous coord existe : transposition de fonction affine
                    {
                       

                        if (currentCoord.Key - previousCoord.Key != 0)
                        {
                            a = (currentCoord.Value - previousCoord.Value) / (currentCoord.Key - previousCoord.Key);
                            b = currentCoord.Value - a * currentCoord.Key;
                        }
                        //Console.WriteLine("a = " + a + ", b = " + b);
                    }


                    while (x < currentCoord.Key)
                    {
                        decimal y = a * x + b;
                        //Console.WriteLine("x = " + x + ", y = " + y);
                        lorenzDeciles.Add(new KeyValuePair<decimal, decimal>(x, Math.Round(y, 4, MidpointRounding.ToEven)));
                        x += new decimal(0.05);
                    }

                    previousCoord = currentCoord;

                }

                lorenzDecilesEachYear.Add(year, lorenzDeciles);
            }

            ldata.LorenzDeciles = lorenzDecilesEachYear;

            return ldata;

        }

        public Dictionary<string, decimal> calculerGini()
        {
            // Gini = 1 - Somme ( (Xk+1 - Xk)*(Yk+1 + Yk) )
            // X = part cumulé de la population
            // Y = par du revenu

            Dictionary<string, List<KeyValuePair<decimal, decimal>>> lorenzCurvesEachYear = this.cumulLorenz().LorenzTranches;

            Dictionary<string, decimal> giniEachYear = new Dictionary<string, decimal>();

            foreach (string year in lorenzCurvesEachYear.Keys)
            {
                List<KeyValuePair<decimal, decimal>> lorenzCurve = lorenzCurvesEachYear[year];

                // Do not compute on last object 
                int keyPosition = 0;
                int numberOfKeys = lorenzCurve.Count;

                decimal sommeGini = new decimal(0.0);

                foreach (KeyValuePair<decimal, decimal> kvp in lorenzCurve)
                {
                    if (keyPosition == numberOfKeys - 1)
                        break;

                    decimal partCumulPopulation = kvp.Key;
                    decimal partCumulRevenu = kvp.Value;

                    decimal partCumulPopulationNext = lorenzCurve.ElementAt(keyPosition + 1).Key;
                    decimal partCumulRevenuNext = lorenzCurve.ElementAt(keyPosition + 1).Value;

                    //(Xk+1 - Xk)
                    decimal partPop = partCumulPopulationNext - partCumulPopulation;

                    //(Yk+1 + YK)
                    decimal partRev = partCumulRevenuNext + partCumulRevenu;

                    decimal result = partPop * partRev;
                    sommeGini += result;

                    keyPosition++;
                }

                decimal gini = 1 - sommeGini;
                giniEachYear.Add(year, gini);

            }

            return giniEachYear;

        }

        internal Dictionary<int, Departement> getData()
        {
            Dictionary<int, Departement> dataForEachYear = new Dictionary<int, Departement>();
            foreach (Departement dep in everyYearsForCurrentDepartement)
            {
                dataForEachYear.Add(dep.year, dep);
            }
            return dataForEachYear;
        }
    }
}
