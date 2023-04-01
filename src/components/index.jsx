import { createElement, useState, useEffect } from "react";
import * as PapaParse from "papaparse";
import _ from "lodash";
import moment from "moment";
import { PivotViewComponent, FieldList, Inject, Toolbar } from '@syncfusion/ej2-react-pivotview';
import "./pivot.css";

const gridSettings = {
    allowAutoResizing: true,
    gridLines: "Both",
    clipMode: "EllipsisWithTooltip"
};

const PivotTable = ({ csv, headerMeta, downloadReport, rows, filters, columns, values }) => {
    const toolbarOptions = [{ text: 'Search', align: 'Right' }, { text: 'Download', align: 'Left', id: "download" }];

    const [dataSourceSettings, setDataSourceSettings] = useState({
        enableSorting: true,
        valueSortSettings: { headerDelimiter: ' - ' },
        expandAll: false,
        filters: [],
        dataSource: []
    });


    useEffect(() => {
        if (csv.status === "available" 
                && csv.value !== "" 
                && rows.status === "available" 
                && filters.status === "available" 
                && columns.status === "available" 
                && values.status === "available" 
                && headerMeta.status === "available" 
                && headerMeta.value !== "") {
            const rowsParsed = rows.value === "" ? [] : JSON.parse(rows.value);
            const columnsParsed = columns.value === "" ? [] : JSON.parse(columns.value);
            const valuesParsed = values.value === "" ? [] : JSON.parse(values.value);
            const filtersParsed = filters.value === "" ? [] : JSON.parse(filters.value);
            const parsedFile = PapaParse.parse(csv.value.trim(), {
                delimiter: ',',
                escapeChar: '\\',
                header: true,
                quoteChar: '"',
                newLine: '\r\n',
                error: (err) => {
                    console.error("Error while parsing CSV:", err);
                }
            })
            const rowsData = parsedFile.data
            let columnsMeta = []
            try {
                columnsMeta = JSON.parse(headerMeta.value).filter((el) => parsedFile.meta.fields.includes(el.attributeName));
            } catch (error) {
                columnsMeta = parsedFile.meta.fields.map(field => ({
                    "attributeName": field,
                    "displayName": field.replace(/([A-Z][a-z])/g, ' $1').replace(/(\d)/g, ' $1'),
                    "dataType": "String",
                    "order": 0
                }))
                console.error(error)
            }

            for (let i = 0; i < rowsData.length; i++) {
                const element = rowsData[i];
                const keys = Object.keys(element);
                for (let j = 0; j < keys.length; j++) {
                    const formattedData = formatColumn(element[keys[j]], columnsMeta.find(x => x.attributeName === keys[j])?.dataType || "String")
                    rowsData[i][keys[j]] = formattedData;
                }
            }

            setTimeout(() => {
                setDataSourceSettings(prev => ({
                    ...prev,
                    columns: columnsParsed.map(x => ({name: x.value, caption: x.label})),
                    rows: rowsParsed.map(x => ({name: x.value, caption: x.label})),
                    values: valuesParsed.map(x => ({name: x.value, caption: x.label})),
                    filters: filtersParsed.map(x => ({name: x.value, caption: x.label})),
                    dataSource: rowsData,
                }))
            }, 100)

        }
    }, [csv, rows, filters, columns, values, headerMeta])


    const formatColumn = (value, dataType) => {
        if (dataType === "Date" || dataType === "DateTime") {
            return moment.unix(value / 1000).format("MM/DD/YYYY")
        }
        else if (dataType === "Boolean") {
            return !!value ? "Yes" : "No";
        }
        else if (dataType === "Integer") {
            return parseInt(value)
        } else if (dataType === "Decimal") {
            return parseFloat(value)
        } else if (dataType === "Currency") {
            return parseFloat(value)
        } else if (dataType === "Percentage") {
            return parseFloat(value)
        }
        return value
    }

    const clickHandler = (args) => {
        if (args.item.id === 'download') {
            if(downloadReport.canExecute) {
                downloadReport.execute()
            }
        }
    };

    return <div className='control-pane'>
        <div className='control-section' style={{ overflow: 'auto' }}>
            {dataSourceSettings.dataSource.length > 0 &&
                <PivotViewComponent toolbarClick={clickHandler} toolbar={toolbarOptions} showFieldList={true} dataSourceSettings={dataSourceSettings} width={'100%'} gridSettings={gridSettings}>
                    <Inject services={[FieldList, Toolbar]}></Inject>
                </PivotViewComponent>
            }
        </div>
    </div>;
}

export default PivotTable
