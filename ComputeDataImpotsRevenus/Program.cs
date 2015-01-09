using ImpotRevenuParser.model;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using ComputeDataImpotsRevenus.Model;

namespace ComputeDataImpotsRevenus
{
    class Program
    {
        static void Main(string[] args)
        {

            Dictionary<string, Departement[]> listEachYearAllDepartments = DepartementDeserializer.getEveryYearWithAllDepartements();
            List<DepartementData> listAllDepData = new List<DepartementData>();
            List<string> listDepStrings = new List<string>();
            // objet liste contenant toutes les années d'un même département
            foreach (Departement dep in listEachYearAllDepartments[listEachYearAllDepartments.Keys.ElementAt(0)])
            {
                DepartementProcessor depProc = new DepartementProcessor(dep, listEachYearAllDepartments);
                DepartementData depData = new DepartementData();
                depData.Nom = dep.depName;
                depData.Numero = dep.depNumber;
                depData.Moyennes = depProc.calculerMoyenne();
                depData.Lorenz = depProc.cumulLorenz();
                depData.Gini = depProc.calculerGini();
                depData.Data = depProc.getData();
                depData.JSONserialize(dep.depNumber + ".json");

                listAllDepData.Add(depData);

                listDepStrings.Add(dep.depNumber + " - " + dep.depName);

            }

            foreach (string year in listEachYearAllDepartments.Keys)
            {

                List<DepartementYearData> yd = new List<DepartementYearData>();
                foreach (DepartementData dep in listAllDepData)
                {
                    DepartementYearData yeardt = new DepartementYearData();
                    yeardt.DepNum = dep.Numero;
                    yeardt.Nom = dep.Nom;
                    yeardt.Gini = dep.Gini[year];
                    yeardt.Moyenne = dep.Moyennes[year];
                    yd.Add(yeardt);
                    
                }
                DepartementYearData.JSONSerialize(yd.ToArray(), year);
            }

            // serialize deplist
            DirectoryInfo rootSolutionDir = new DirectoryInfo(Directory.GetParent(Directory.GetCurrentDirectory()).Parent.FullName).Parent;
            DirectoryInfo jsonDirComp = new DirectoryInfo(Path.Combine(rootSolutionDir.FullName, "resources", "departements_json_computed"));
            FileInfo jsonfile = new FileInfo(Path.Combine(jsonDirComp.FullName, "deplist.json"));
            if (!jsonfile.Exists)
            {
                using (StreamWriter writer = new StreamWriter(jsonfile.FullName))
                {
                    writer.Write(JsonConvert.SerializeObject(listDepStrings.ToArray()));
                }
            }

            Console.WriteLine("End of program");
            Console.ReadLine();



        }
    }
}
