using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ImpotsExcelDownloader
{
    class Program
    {
        static void Main(string[] args)
        {
            DirectoryInfo rootSolutionDir = new DirectoryInfo(Directory.GetParent(Directory.GetCurrentDirectory()).Parent.FullName).Parent;

            // check resources folder exists or create it
            DirectoryInfo resDir = new DirectoryInfo(Path.Combine(rootSolutionDir.FullName, "resources"));

            if (!resDir.Exists)
            {
                Console.WriteLine("Create resources dir at : " + resDir.FullName);
                resDir.Create();
            }
            else
            {
                Console.WriteLine("resources directory found");
            }

            // check folders for each year exist

            for (int i = 2003; i != 2014; i++)
            {
                DirectoryInfo yearDir = new DirectoryInfo(Path.Combine(resDir.FullName, i.ToString()));
                if (!yearDir.Exists)
                {
                    Console.WriteLine("Create resources dir at : " + yearDir.FullName);
                    yearDir.Create();
                }
                else
                {
                    Console.WriteLine("year " + i.ToString() + " directory found");
                }

            }

            // start downloading ?
            for (int i = 2003; i != 2014; i++)
            {
                Console.WriteLine("Year " + i);
                if(i != 2010) // oops, changement de datation 
                    ExcelDownloader.downloadExcelDepartementsForYear(i, Path.Combine(resDir.FullName, i.ToString()));
                //break;
            }

            Console.ReadLine();
        }
    }
}
