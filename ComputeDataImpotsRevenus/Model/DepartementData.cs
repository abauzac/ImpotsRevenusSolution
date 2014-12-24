using Newtonsoft.Json;
using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ComputeDataImpotsRevenus.Model
{
    class DepartementData
    {

        public Dictionary<string, decimal> Gini;

        public Dictionary<string, List<KeyValuePair<decimal, decimal>>> Lorenz;

        public Dictionary<string, decimal> Moyennes;

        public void JSONserialize(string filename){

            DirectoryInfo rootSolutionDir = new DirectoryInfo(Directory.GetParent(Directory.GetCurrentDirectory()).Parent.FullName).Parent;

            DirectoryInfo jsonDirComp = new DirectoryInfo(Path.Combine(rootSolutionDir.FullName, "resources", "departements_json_computed"));
            if (!jsonDirComp.Exists)
            {
                jsonDirComp.Create();
            }

            FileInfo jsonfile = new FileInfo(Path.Combine(jsonDirComp.FullName, filename));
            if (!jsonfile.Exists)
            {
                using (StreamWriter writer = new StreamWriter(jsonfile.FullName))
                {
                    writer.Write(JsonConvert.SerializeObject(this));
                }
            }

        }
    }
}
