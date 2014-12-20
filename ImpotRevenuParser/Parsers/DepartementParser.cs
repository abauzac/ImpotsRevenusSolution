using ImpotRevenuParser.ExcelWrapper;
using ImpotRevenuParser.model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ImpotRevenuParser.Parsers
{
    class DepartementParser
    {
        private RangeWrapper listCells;
        /// <summary>
        /// Column position where there is the department name
        /// </summary>
        private int depColumn;
        private int trancheColumn;

        public int nbFoyersColumn { get; set; }

        public int revFoyersColumn { get; set; }

        public int impotColumn { get; set; }

        public int nbFoyersImposColumn { get; set; }

        public int revFoyersImposColumn { get; set; }

        public int salairesColumn { get; set; }

        public int retraitesColumns { get; set; }

        public int lastTableRow { get; set; }
        /// <summary>
        /// Row position where there *should* be all the table headers of the department table
        /// </summary>
        private int depTitlesTableRowNum;

        

        public DepartementParser(RangeWrapper _rw)
        {
            this.listCells = _rw;
            CellWrapper cw = this.listCells.find("Département");
            this.depColumn = cw.colNumber;
            this.depTitlesTableRowNum = cw.rowNumber;

        }

        public Departement getDepartement()
        {
            // choper colone "Revenu fiscal de référence par tranche" (1ere colone cherchée)
            List<CellWrapper> rowHeaders = this.listCells.find(cell => cell.rowNumber == this.depTitlesTableRowNum);
            foreach (CellWrapper ccw in rowHeaders)
            {
                this.setHeaderColumns(ccw);
            }

            // descendre du titre jusqu'à "Total"
            if (this.trancheColumn != null)
            {
                CellWrapper cellTotal = this.listCells.find(cell => cell.colNumber == this.trancheColumn && cell.cellContent.Contains("Total")).First();
                if (cellTotal != null)
                {
                    this.lastTableRow = cellTotal.rowNumber;
                    Departement dep = this.getDepartementInfos();
                    return dep;
                }
                else
                {
                    return null;
                }
            }
            else
            {
                throw new Exception("trancheColumn not found...");
            }
        }

        private Departement getDepartementInfos()
        {
            Departement dep = new Departement();

            // loop over rows until lastTableRow
            List<Tranche> listTranches = new List<Tranche>();
            for (int rowNum = this.depTitlesTableRowNum + 1; rowNum <= this.lastTableRow; rowNum++)
            {
                if (rowNum != this.lastTableRow)
                {
                    Tranche t = this.getTranchesInfo(rowNum);
                    if (t == null)
                    {
                        continue;
                    }
                    else
                    {
                        if(String.IsNullOrEmpty(dep.depName)){
                            dep.depName = this.getCellText(rowNum, this.depColumn);
                            dep.depNumber = this.getCellText(rowNum, this.depColumn - 2);
                        }
                        listTranches.Add(t);
                    }
                }
                else
                {
                    this.setDepartementTotals(dep, rowNum);
                }
            }

            dep.tranches = listTranches.ToArray();

            return dep;
        }

        private void setDepartementTotals(Departement dep, int rowNumber)
        {
            dep.nbFoyers = this.getCellNumber(rowNumber, this.nbFoyersColumn);
            dep.revenus = this.getCellNumber(rowNumber, this.revFoyersColumn);
            dep.impot = this.getCellNumber(rowNumber, this.impotColumn);
            dep.nbFoyersImposables = this.getCellNumber(rowNumber, this.nbFoyersImposColumn);
            dep.revenusImposables = this.getCellNumber(rowNumber, this.revFoyersImposColumn);
            dep.nbFoyers_salaires = this.getCellNumber(rowNumber, this.salairesColumn);
            dep.revenus_salaires = this.getCellNumber(rowNumber, this.salairesColumn + 1);
            dep.nbFoyers_retraites = this.getCellNumber(rowNumber, this.retraitesColumns);
            dep.revenus_retraites = this.getCellNumber(rowNumber, this.retraitesColumns + 1);
        }

        private Tranche getTranchesInfo(int rowNumber)
        {
            
            Tranche tranche = new Tranche();
            string trancheName = this.getCellText(rowNumber, this.trancheColumn);
            // filter if cell is blank;
            if(String.IsNullOrEmpty(trancheName))
                return null;
            tranche.trancheName = trancheName;
            int[] trancheMinMax = this.getTranchesMinMax(tranche.trancheName);
            if (trancheMinMax.Count() == 2)
            {
                tranche.trancheMin = trancheMinMax[0];
                tranche.trancheMax = trancheMinMax[1];
            }
            else if (trancheMinMax.Count() == 1)
            {
                tranche.trancheMin = trancheMinMax[0];
            }
            tranche.nbFoyers = this.getCellNumber(rowNumber, this.nbFoyersColumn);
            tranche.revenus = this.getCellNumber(rowNumber, this.revFoyersColumn);
            tranche.impot = this.getCellNumber(rowNumber, this.impotColumn);
            tranche.nbFoyersImposables = this.getCellNumber(rowNumber, this.nbFoyersImposColumn);
            tranche.revenusImposables = this.getCellNumber(rowNumber, this.revFoyersImposColumn);
            tranche.nbFoyers_salaires = this.getCellNumber(rowNumber, this.salairesColumn);
            tranche.revenus_salaires = this.getCellNumber(rowNumber, this.salairesColumn + 1);
            tranche.nbFoyers_retraites = this.getCellNumber(rowNumber, this.retraitesColumns);
            tranche.revenus_retraites = this.getCellNumber(rowNumber, this.retraitesColumns + 1);
            
            return tranche;

        }

        private int[] getTranchesMinMax(string trancheName)
        {
            if (String.IsNullOrEmpty(trancheName))
                return null;

            int[] arrayTranches = null;
            string[] tmpArray = null;
            if(trancheName.Contains('à'))
            {
                tmpArray = trancheName.Split('à');
                if (tmpArray.Count() == 2)
                {
                    arrayTranches = new int[2];
                    arrayTranches[0] = Convert.ToInt32(tmpArray[0].Replace(" ", String.Empty));
                    arrayTranches[1] = Convert.ToInt32(tmpArray[1].Replace(" ", String.Empty));
                }
                else
                {
                    throw new Exception("Array malformed : " + tmpArray.Count());
                }
            }
            else if (trancheName.Contains("+ de"))
            {
                arrayTranches = new int[1];
                arrayTranches[0] = Convert.ToInt32(trancheName.Replace("+ de", String.Empty).Replace(" ", String.Empty));
            }
            else{
                throw new Exception("TrancheName value unknown : " + trancheName);
            }



            return arrayTranches;
        }

        private long getCellNumber(int rowNumber, int colNumber)
        {
            CellWrapper cw = null;

            cw = this.listCells.find(cell => cell.rowNumber == rowNumber && cell.colNumber == colNumber).First();
            if (cw != null && !String.IsNullOrEmpty(cw.cellContent))
            {
                if (cw.cellContent.Contains("n.d."))
                {
                    return -1;
                }
                else
                {
                    return Convert.ToInt64(cw.cellContent);
                }
            }
            else
            {
                return -1;
            }
        }

        private string getCellText(int rowNumber, int colNumber)
        {
            CellWrapper cw = null;

            cw = this.listCells.find(cell => cell.rowNumber == rowNumber && cell.colNumber == colNumber).First();
            if (cw != null && !String.IsNullOrEmpty(cw.cellContent))
            {
                return cw.cellContent;
            }
            else
            {
                return String.Empty;
            }
        }

        private void setHeaderColumns(CellWrapper ccw)
        {
           string cellcontent = ccw.cellContent;

           if (cellcontent.Contains(DepartementTableHeaders.TRANCHE))
               this.trancheColumn = ccw.colNumber;
           else if (cellcontent.Contains(DepartementTableHeaders.NB_FOYERS_IMPOSABLES_TRANCHE))
               this.nbFoyersImposColumn = ccw.colNumber;
           else if (cellcontent.Contains(DepartementTableHeaders.REV_FOYERS_IMPOSABLES_TRANCHE))
               this.revFoyersImposColumn = ccw.colNumber;
           else if (cellcontent.Contains(DepartementTableHeaders.NB_FOYERS_TRANCHE))
               this.nbFoyersColumn = ccw.colNumber;
           else if (cellcontent.Contains(DepartementTableHeaders.REV_FOYERS))
               this.revFoyersColumn = ccw.colNumber;
           else if (cellcontent.Contains(DepartementTableHeaders.IMPOT))
               this.impotColumn = ccw.colNumber;
           else if (cellcontent.Contains(DepartementTableHeaders.SALAIRES))
               this.salairesColumn = ccw.colNumber;
           else if (cellcontent.Contains(DepartementTableHeaders.RETRAITES))
               this.retraitesColumns = ccw.colNumber;
                

        }


    }
}
