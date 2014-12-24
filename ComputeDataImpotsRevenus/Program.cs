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

            List<Departement[]> listEachYearAllDepartments = DepartementDeserializer.getEveryYearWithAllDepartements();

            // objet liste contenant toutes les années d'un même département
            foreach (Departement dep in listEachYearAllDepartments[0])
            {
                DepartementProcessor depProc = new DepartementProcessor(dep, listEachYearAllDepartments);
                DepartementData depData = new DepartementData();
                depData.Moyennes = depProc.calculerMoyenne();
                depData.Lorenz = depProc.cumulLorenz();
                depData.Gini = depProc.calculerGini();
                depData.JSONserialize(dep.depNumber + ".json");
            }

            Console.WriteLine("End of program");
            Console.ReadLine();



        }
    }
}
