# -*- coding: utf-8 -*-
"""

https://www.data.gouv.fr/fr/datasets/l-impot-sur-le-revenu-par-collectivite-territoriale/

package nécessaires : pandas, xlrd



"""

from os.path import join
import pandas as pd
import os, glob


def parseFile(fileinput, fileoutput):
    """

    :param fileinput: xls file path to parse
    :param fileoutput: csv file path to output
    :raise:
    """
    print("input=" + fileinput)
    print("output=" + fileoutput)
    column_names = ['code_dep', 'code_commune', 'nom_commune', 'tranche_revenus',
                    'nbFoyers', 'revenus', 'impot_total', 'nbFoyersImposables',
                    'revenusImposables', 'nbFoyers_salaires',
                    'revenus_salaires', 'nbFoyers_retraites', 'revenus_retraites']

    print("Loading dataframe")

    table = pd.DataFrame(columns=column_names)
    try:

        exceldataframe = pd.read_excel(fileinput,
                                       0,
                                       skiprows=23,
                                       na_values=["n.d."])
        exceldataframe = exceldataframe.iloc[:, 1:]

        exceldataframe.columns = column_names

        # remove cities with "null" name
        exceldataframe = exceldataframe[pd.notnull(exceldataframe["nom_commune"])]

        # format code dep & code commune to match excel files
        exceldataframe["code_dep"] = exceldataframe["code_dep"].map(mapDepartement)
        exceldataframe["code_commune"] = exceldataframe["code_commune"].map(mapCodeCommune)

        if len(exceldataframe) == 0:
            print('dataframe is empty ?')
            raise

        table = table.append(exceldataframe, ignore_index=True)
    except:
        print('Exception raised')
        raise

    #create csv file
    table.to_csv(fileoutput, index=False)

def mapDepartement(x):
    if (isinstance(x, str)):
        return x
    elif (x.dtype == float or int(x) == x):
        return '{0:03d}'.format(int(x))


def mapCodeCommune(y):
    return '{0:03d}'.format(int(y))


def load_ircom(folderinput, folderoutput):

    for infile in os.listdir(folderinput):
        if ("xls" in infile):
            filepath = join(folderinput, infile)
            parseFile(filepath, join(folderoutput, infile.replace("xls", "csv")))

    print('Finished folder : ' + folderinput)


if __name__ == '__main__':

    cwd = os.getcwd()

    # you can fill folderinput directly from here instead of terminal
    folderinput = join(cwd, "..\\resources")

    if(folderinput == ""):
        folderinput = input("Folder to parse : ")

    if not(os.path.isdir(folderinput)):
        raise Exception( "folderinput is not a folder")

    if not(os.path.isdir(join(cwd, "out"))):
            os.mkdir(join(cwd, "out"))

    # parse on folders 2003, 2004, etc.


    for yearfolder in os.listdir(folderinput):
        if(yearfolder == "2013"):
            if not(os.path.isdir(join(cwd, "out", yearfolder))):
                os.mkdir(join(cwd, "out", yearfolder))

            load_ircom(join(folderinput, yearfolder),
                   join(cwd, "out", yearfolder))


