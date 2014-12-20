using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace ImpotsExcelDownloader
{
    class ExcelDownloader
    {
        /// <summary>
        /// Base url 
        /// Example : http://www2.impots.gouv.fr/documentation/statistiques/ircom2003/dep/430.xls
        /// </summary>
        public static string baseUrl = "http://www2.impots.gouv.fr/documentation/statistiques/";

        public static void downloadExcelDepartementsForYear(int year, string strPath)
        {
            string urlToDownload = baseUrl + "ircom" + year + "/dep/";
            Dictionary<string, string> depList = new Dictionary<string, string>();

            for (int i = 1; i != 97; i++)
            {
                // 1 to 10
                if (i < 10)
                {
                    depList.Add(urlToDownload + "0" + i + "0.xls", Path.Combine(strPath, "0" + i + "0.xls"));
                }
                // Corsica
                else if (i == 20) 
                {
                    depList.Add(urlToDownload + "2A0.xls", Path.Combine(strPath, "2A0.xls"));
                    depList.Add(urlToDownload + "2B0.xls", Path.Combine(strPath, "2B0.xls"));
                }
                // 96 - DOM = 971, 972, 973, 974
                else if (i == 96)
                {
                    depList.Add(urlToDownload + "971.xls", Path.Combine(strPath, "971.xls"));
                    depList.Add(urlToDownload + "972.xls", Path.Combine(strPath, "972.xls"));
                    depList.Add(urlToDownload + "973.xls", Path.Combine(strPath, "973.xls"));
                    depList.Add(urlToDownload + "974.xls", Path.Combine(strPath, "974.xls"));
                }
                // others
                else
                {
                    depList.Add(urlToDownload + i + "0.xls", Path.Combine(strPath, i + "0.xls"));
                }
            }

            downloadFiles(depList);
        }

        private static void downloadFiles(Dictionary<string, string> urls)
        {
            using (WebClient wc = new WebClient())
            {
                foreach (string url in urls.Keys)
                {
                    if (!(new FileInfo(urls[url]).Exists))
                    {
                        wc.DownloadFile(url, urls[url]);
                    }
                }
            }

        }

    }
}
