using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ImpotRevenuParser.model
{
    public class Departement : ImpotsRevenus
    {
        public string depNumber;

        public string depName;

        public int year;
        /// <summary>
        /// Tableau des tranches de revenu fiscal de reference
        /// </summary>
        public Tranche[] tranches;

        

    }
}
