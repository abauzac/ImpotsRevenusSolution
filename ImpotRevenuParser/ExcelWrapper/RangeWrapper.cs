using Microsoft.Office.Interop.Excel;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ImpotRevenuParser.ExcelWrapper
{
    public class RangeWrapper
    {
        public List<CellWrapper> rangeCells; 
        private Range range = null;
        public RangeWrapper(Range _range)
        {
            this.range = _range;
            this.convertRangeToArray();
        }

        private void convertRangeToArray(){
            if (this.range == null)
                throw new Exception("range is null");

            int numCols = this.range.Columns.Count;
            int numRows = this.range.Rows.Count;
            List<CellWrapper> listCells = new List<CellWrapper>();
            int i = 0;
            foreach (Range cell in this.range)
            {
                if (i++ > 600) break;
                listCells.Add(new CellWrapper(cell));
                
            }
            this.rangeCells = listCells;
        }

        public CellWrapper find(string searchValue)
        {
            if(this.rangeCells == null || this.rangeCells.Count == 0)
                throw new Exception("Rangecells is null or empty");


            IEnumerable<CellWrapper> cellsFound = this.rangeCells.Where(cell => cell.cellContent.Contains(searchValue));

            if (cellsFound != null && cellsFound.Count() == 1)
            {
                CellWrapper cell = cellsFound.First();
                return cell;
            }
            else
            {
                throw new Exception("Null OR Multiple cells with Department ");
            }
        }

        public List<CellWrapper> find(Func<CellWrapper, bool> predicate)
        {
            if (this.rangeCells == null || this.rangeCells.Count == 0)
                throw new Exception("Rangecells is null or empty");


            IEnumerable<CellWrapper> cellsFound = this.rangeCells.Where(predicate);

            if (cellsFound != null)
            {
                List<CellWrapper> list = cellsFound.ToList();
                return list;
            }
            else
            {
                throw new Exception("Exception during search, cellsfound is null");
            }
        }
    }
}
