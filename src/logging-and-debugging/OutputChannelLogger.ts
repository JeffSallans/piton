import { json2csv } from "json-2-csv";
import { take } from "lodash";
import { OutputChannel, window } from "vscode";

export class OutputChannelLogger {

    public static outputChannel = window.createOutputChannel("Piton");

    private constructor() {}

    public static show() {
        OutputChannelLogger.outputChannel.show(true);
    }

    public static log(message: any, reveal = false) {
        OutputChannelLogger.outputChannel.appendLine(message);
        if (reveal) {
            OutputChannelLogger.outputChannel.show(true);
        }
        console.log(message);
    }

    public static logTable(data: any[], reveal = false, maxRows = 5) {
        const shortenedData = take(data, maxRows);
        const dataAsString = json2csv(shortenedData, { delimiter: {field: '\t'}});
        if (data.length > maxRows) {
            this.log(`====== RESULT ======\n${dataAsString}\n(${data.length - maxRows} more rows)`, reveal);
        }
        else {
            this.log(`====== RESULT ======\n${dataAsString}`, reveal);
        }
    }

    public static error(message: any, reveal = false) {
        OutputChannelLogger.outputChannel.appendLine(message);
        if (reveal) {
            OutputChannelLogger.outputChannel.show(true);
        }
        console.error(message);
    }
}