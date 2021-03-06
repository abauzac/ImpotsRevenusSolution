﻿using ImpotRevenuParser.model;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ComputeDataImpotsRevenus
{
    class DepartementDeserializer
    {
        public static Dictionary<string,Departement[]> getEveryYearWithAllDepartements()
        {
            DirectoryInfo rootSolutionDir = new DirectoryInfo(Directory.GetParent(Directory.GetCurrentDirectory()).Parent.FullName).Parent;

            DirectoryInfo jsonDir = new DirectoryInfo(Path.Combine(rootSolutionDir.FullName, "resources", "departements_json"));
            
            FileInfo[] listfiles;
            if(jsonDir.Exists){
                listfiles = jsonDir.GetFiles();
                if(listfiles.Count() <= 0){
                    throw new Exception("Oups, no files in json_directory...");
                }
            }else{
                throw new Exception("Oups, directory not found : " + jsonDir.FullName);
            }

            // cache full list of departments
            Dictionary<string, Departement[]> listEachYearAllDepartments = new Dictionary<string, Departement[]>();
            foreach (FileInfo file in listfiles)
            {
                Departement[] OneYearAllDep = JsonConvert.DeserializeObject<Departement[]>(File.ReadAllText(file.FullName));
                string year = file.Name.Substring(0, file.Name.IndexOf('.'));
                OneYearAllDep.ToList().ForEach(dep => dep.year = Convert.ToInt32(year));

                if(OneYearAllDep != null && OneYearAllDep.Count() > 0)
                    listEachYearAllDepartments.Add(year, OneYearAllDep);
            }

            if (listEachYearAllDepartments.Count == listfiles.Count())
            {
                return listEachYearAllDepartments;
            }
            else
            {
                throw new Exception("La liste pour chaque année ne correspond pas avec le nombre de fichiers dans le dossier");
            }
        }

    }
}
