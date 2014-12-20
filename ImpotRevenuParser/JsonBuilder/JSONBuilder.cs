using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ImpotRevenuParser.JsonBuilder
{
    class JSONBuilder
    {
        private object[][] arrayExcel;

        public JSONBuilder(object[][] arrayExcel)
        {
            this.arrayExcel = arrayExcel;


            var content = from row in arrayExcel
                          where row != null
                          where row.Length > 0
                          from value in row
                          where value != null
                          where value.GetType() == typeof(string)
                          where ((string)value).Contains("Revenu fiscal de référence par tranche (en euros)")
                          select value;

            Console.WriteLine();
        }


    }
}
