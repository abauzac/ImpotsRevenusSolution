using Microsoft.Office.Interop.Excel;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ImpotRevenuParser.ExcelWrapper
{
    public class CellWrapper
    {
        Range cell = null;
        /// <summary>
        /// Column name in Excel formating (A, B...)
        /// </summary>
        public string colPosition;
        /// <summary>
        /// Row name in Excel formating (1, 2...)
        /// </summary>
        public string rowPosition;
        /// <summary>
        /// Cell address in Excel formating (A2, A3...)
        /// </summary>
        public string cellAddress;

        /// <summary>
        /// Cell address in interop Excel formatting ($A$2, $A$3...)
        /// </summary>
        public string rangeAddress;
        /// <summary>
        /// Column number of the cell
        /// </summary>
        public int colNumber;
        /// <summary>
        /// row number of the cell
        /// </summary>
        public int rowNumber;

        public string cellContent;

        public CellWrapper(Range _cell)
        {
            if (_cell.Count != 1)
                throw new Exception("Cell Range has " + _cell.Count + " cell(s) so it can't be a unique cell.");

            this.cell = _cell;
            this.colNumber = this.cell.Column;
            this.rowNumber = this.cell.Row;

            var cellValue = this.cell.get_Value(XlRangeValueDataType.xlRangeValueDefault);
            if (cellValue != null )
            {
                if (cellValue.GetType() == typeof(string))
                {
                    this.cellContent = (string)cellValue;
                }
                else
                {
                    this.cellContent = cellValue.ToString();
                }
            }
            else
            {
                this.cellContent = String.Empty;
            }

            string[] cellAddress = this.cell.get_Address().Split('$');
            if (cellAddress.Length == 3)
            {
                this.colPosition = cellAddress[1];
                this.rowPosition = cellAddress[2];
                this.cellAddress = this.colPosition + this.rowPosition;
                this.rangeAddress = this.cell.get_Address();
            }
            else
            {
                throw new Exception("cellAddress is wrongly formated ! " + this.cell.get_Address());
            }
        }
    }
}
