using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Office.Interop.Excel;
using System.Runtime.InteropServices;
using ImpotRevenuParser.JsonBuilder;
using ImpotRevenuParser.ExcelWrapper;
using ImpotRevenuParser.Parsers;
using ImpotRevenuParser.model;
using System.IO;
using Newtonsoft.Json;

namespace ImpotRevenuParser
{
    class Program
    {
        static void Main(string[] args)
        {
            Application excel = new Application();
            Workbook wkbk = null;

            List<Departement> listeDep = new List<Departement>();

            DirectoryInfo rootSolutionDir = new DirectoryInfo(Directory.GetParent(Directory.GetCurrentDirectory()).Parent.FullName).Parent;

            // check resources folder exists or create it
            DirectoryInfo resDir = new DirectoryInfo(Path.Combine(rootSolutionDir.FullName, "resources"));

            DirectoryInfo[] yearsDir = resDir.GetDirectories();
            foreach (DirectoryInfo yearDir in yearsDir)
            {
                FileInfo jsonFile = new FileInfo(Path.Combine(yearDir.FullName, yearDir.Name + ".json"));
                if (!jsonFile.Exists)
                {
                    Console.WriteLine("Parsing year " + yearDir.Name);
                    FileInfo[] depFiles = yearDir.GetFiles();
                    foreach (FileInfo file in depFiles)
                    {
                        Console.WriteLine("Departement : " + file.Name);
                        wkbk = excel.Workbooks.Open(file.FullName);

                        if (wkbk.Sheets.Count == 1)
                        {
                            Worksheet firstSheet = (Worksheet)wkbk.Sheets[1];
                            RangeWrapper rw = new RangeWrapper(firstSheet.UsedRange);

                            wkbk.Close(false, file.FullName, null);

                            DepartementParser dp = new DepartementParser(rw);
                            listeDep.Add(dp.getDepartement());

                        }
                        else
                        {
                            wkbk.Close(false, file.FullName, null);
                            throw new Exception("Excel file has " + wkbk.Sheets.Count + " workbooks");
                        }

                    }


                    Console.WriteLine("Creating JSON file");
                    using (StreamWriter writer = new StreamWriter(jsonFile.FullName))
                    {
                        writer.Write(JsonConvert.SerializeObject(listeDep.ToArray()));
                        listeDep.Clear();
                    }
                }
            }

            Marshal.ReleaseComObject(wkbk);
            Marshal.ReleaseComObject(excel);
            Console.WriteLine("End of program");
            Console.ReadLine();
        }

    }
}
