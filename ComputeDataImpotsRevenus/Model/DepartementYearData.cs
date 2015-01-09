using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;

namespace ComputeDataImpotsRevenus
{
    class DepartementYearData
    {
        public decimal Gini;
        public string Nom;
        public string DepNum;
        public decimal Moyenne;


        public DepartementYearData()
        {

        }

        /// <summary>
        /// Serialise un tableau contenant tous les départements d'une même année
        /// </summary>
        /// <param name="yearDepartements"></param>
        public static void JSONSerialize(DepartementYearData[] yearDepartements, string year)
        {
            DirectoryInfo rootSolutionDir = new DirectoryInfo(Directory.GetParent(Directory.GetCurrentDirectory()).Parent.FullName).Parent;
            DirectoryInfo jsonComputedDir = new DirectoryInfo(Path.Combine(rootSolutionDir.FullName, "resources", "annees_json_computed"));

            if (!jsonComputedDir.Exists) jsonComputedDir.Create();

            FileInfo jsonfile = new FileInfo(Path.Combine(jsonComputedDir.FullName, year + ".json"));
            if (!jsonfile.Exists)
            {
                using (StreamWriter writer = new StreamWriter(jsonfile.FullName))
                {
                    writer.Write(JsonConvert.SerializeObject(yearDepartements));
                }
            }

        }

    }
}
