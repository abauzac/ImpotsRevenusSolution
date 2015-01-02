using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ComputeDataImpotsRevenus.Model
{
    class LorenzData
    {
        /// <summary>
        /// Pour chaque année (string)
        /// Liste de clef/valeur correspondants à cumul de population/cumul des revenus
        /// Par tranche 
        /// </summary>
        public Dictionary<string, List<KeyValuePair<decimal, decimal>>> LorenzTranches;

        /// <summary>
        /// Pour chaque année (string)
        /// Liste de clef/valeur correspondants à cumul de population/cumul des revenus
        /// Lissé en 10 déciles par interpolation linéaire 
        /// </summary>
        public Dictionary<string, List<KeyValuePair<decimal, decimal>>> LorenzDeciles;
    }
}
