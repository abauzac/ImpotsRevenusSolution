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

        public Dictionary<string, List<KeyValuePair<decimal, decimal>>> cumulLorenz()
        {
            Dictionary<string, List<KeyValuePair<decimal, decimal>>> lorenzCurvesEachYear = new Dictionary<string, List<KeyValuePair<decimal, decimal>>>();

            foreach (Departement dep in everyYearsForCurrentDepartement)
            {

                List<KeyValuePair<decimal, decimal>> lorenzCurve = new List<KeyValuePair<decimal, decimal>>();
                lorenzCurve.Add(new KeyValuePair<decimal,decimal>(new decimal(0),new decimal(0)));
                decimal previousPopulationProp = new Decimal(0);
                decimal previousRevenuProp = new Decimal(0);
                

                foreach (Tranche tranche in dep.tranches)
                {
                    previousRevenuProp = Math.Round((decimal) tranche.revenus / (decimal)dep.revenus + previousRevenuProp, 5, MidpointRounding.ToEven);
                    previousPopulationProp = Math.Round((decimal)tranche.nbFoyers / (decimal)dep.nbFoyers + previousPopulationProp, 5, MidpointRounding.ToEven);

                    lorenzCurve.Add(new KeyValuePair<decimal,decimal>(previousPopulationProp, previousRevenuProp));
                }

                lorenzCurvesEachYear.Add(dep.year.ToString(), lorenzCurve);

            }

            return lorenzCurvesEachYear;
            
        }

        public Dictionary<string, decimal> calculerGini()
        {
            // Gini = 1 - Somme ( (Xk+1 - Xk)*(Yk+1 + Yk) )
            // X = part cumulé de la population
            // Y = par du revenu

            Dictionary<string, List<KeyValuePair<decimal, decimal>>> lorenzCurvesEachYear = this.cumulLorenz();

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
                    if (keyPosition == numberOfKeys-1)
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
